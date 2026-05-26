const express = require('express');
const router = express.Router();
const { authenticate, requireArtisan, optionalAuth } = require('../middleware/auth');
const { upload, uploadToS3 } = require('../middleware/upload');
const { query, getArtefacts, updateArtefactViews, createNotification } = require('../database/queries');
const { validationResult, body } = require('express-validator');

// ============================================
// GET ALL ARTEFACTS (Public with filters)
// ============================================
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            mode = 'local',
            category,
            tribe,
            country,
            min_price,
            max_price,
            search,
            sort = 'newest',
            page = 1,
            limit = 20,
            authenticated_only = false,
            artisan_id
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const values = [];
        let paramCount = 1;
        
        // Base query
        let queryText = `
            SELECT 
                a.*,
                u.full_name as artisan_name,
                u.rating as artisan_rating,
                u.profile_picture_url as artisan_avatar,
                u.id_verified as artisan_verified,
                CASE 
                    WHEN $${paramCount}::boolean THEN 
                        CASE WHEN $${paramCount + 1}::text = 'local' THEN a.local_price ELSE a.foreign_price_usd END
                    ELSE NULL
                END as display_price,
                CASE WHEN $${paramCount + 2}::uuid = a.artisan_id THEN true ELSE false END as is_own
            FROM artefacts a
            JOIN users u ON a.artisan_id = u.id
            WHERE a.status = 'active'
        `;
        
        values.push(!!req.user, mode, req.user?.id || null);
        paramCount += 3;
        
        // Filter by authenticated only
        if (authenticated_only === 'true') {
            queryText += ` AND a.authentication_status = 'verified'`;
        }
        
        // Filter by artisan
        if (artisan_id) {
            queryText += ` AND a.artisan_id = $${paramCount++}`;
            values.push(artisan_id);
        }
        
        // Search filter
        if (search) {
            queryText += ` AND (a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount} OR a.tribe_origin ILIKE $${paramCount})`;
            values.push(`%${search}%`);
            paramCount++;
        }
        
        // Category filter
        if (category && category !== 'all') {
            queryText += ` AND a.category = $${paramCount++}`;
            values.push(category);
        }
        
        // Tribe filter
        if (tribe) {
            queryText += ` AND a.tribe_origin ILIKE $${paramCount++}`;
            values.push(`%${tribe}%`);
        }
        
        // Country filter
        if (country) {
            queryText += ` AND a.country = $${paramCount++}`;
            values.push(country);
        }
        
        // Price filters based on mode
        if (mode === 'local') {
            if (min_price) {
                queryText += ` AND a.local_price >= $${paramCount++}`;
                values.push(parseFloat(min_price));
            }
            if (max_price) {
                queryText += ` AND a.local_price <= $${paramCount++}`;
                values.push(parseFloat(max_price));
            }
        } else {
            if (min_price) {
                queryText += ` AND a.foreign_price_usd >= $${paramCount++}`;
                values.push(parseFloat(min_price));
            }
            if (max_price) {
                queryText += ` AND a.foreign_price_usd <= $${paramCount++}`;
                values.push(parseFloat(max_price));
            }
        }
        
        // Sorting
        switch(sort) {
            case 'price_low':
                queryText += ` ORDER BY ${mode === 'local' ? 'a.local_price' : 'a.foreign_price_usd'} ASC`;
                break;
            case 'price_high':
                queryText += ` ORDER BY ${mode === 'local' ? 'a.local_price' : 'a.foreign_price_usd'} DESC`;
                break;
            case 'popular':
                queryText += ` ORDER BY a.views_count DESC, a.saved_count DESC`;
                break;
            case 'oldest':
                queryText += ` ORDER BY a.created_at ASC`;
                break;
            case 'newest':
            default:
                queryText += ` ORDER BY a.created_at DESC`;
                break;
        }
        
        // Pagination
        queryText += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        values.push(parseInt(limit), offset);
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM artefacts a
            WHERE a.status = 'active'
        `;
        
        const countValues = [];
        let countParamCount = 1;
        
        if (category && category !== 'all') {
            countQuery += ` AND a.category = $${countParamCount++}`;
            countValues.push(category);
        }
        if (search) {
            countQuery += ` AND (a.title ILIKE $${countParamCount} OR a.description ILIKE $${countParamCount})`;
            countValues.push(`%${search}%`);
        }
        
        const totalResult = await query(countQuery, countValues);
        const total = parseInt(totalResult.rows[0].total);
        
        const result = await query(queryText, values);
        
        res.json({
            success: true,
            artefacts: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            },
            filters: {
                mode,
                category,
                tribe,
                country,
                min_price,
                max_price,
                sort
            }
        });
    } catch (error) {
        console.error('Error fetching artefacts:', error);
        res.status(500).json({ error: 'Failed to fetch artefacts', details: error.message });
    }
});

// ============================================
// GET SINGLE ARTEFACT (Public)
// ============================================
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const artefactId = req.params.id;
        
        const result = await query(`
            SELECT 
                a.*,
                u.id as artisan_id,
                u.full_name as artisan_name,
                u.rating as artisan_rating,
                u.total_sales as artisan_total_sales,
                u.profile_picture_url as artisan_avatar,
                u.bio as artisan_bio,
                u.id_verified as artisan_verified,
                u.created_at as artisan_joined,
                (
                    SELECT COUNT(*) FROM reviews r 
                    WHERE r.reviewed_id = u.id AND r.verified_purchase = true
                ) as artisan_review_count,
                (
                    SELECT AVG(rating) FROM reviews r 
                    WHERE r.reviewed_id = u.id
                ) as artisan_average_rating,
                (
                    SELECT COUNT(*) FROM saved_items si 
                    WHERE si.artefact_id = a.id
                ) as saved_count,
                (
                    SELECT EXISTS(
                        SELECT 1 FROM saved_items si 
                        WHERE si.artefact_id = a.id AND si.user_id = $2
                    )
                ) as is_saved
            FROM artefacts a
            JOIN users u ON a.artisan_id = u.id
            WHERE a.id = $1 AND a.status != 'inactive'
        `, [artefactId, req.user?.id || null]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        
        const artefact = result.rows[0];
        
        // Increment view count (async, don't wait)
        updateArtefactViews(artefactId).catch(console.error);
        
        // Get similar artefacts
        const similar = await query(`
            SELECT id, title, main_image_url, 
                   local_price, foreign_price_usd, category
            FROM artefacts
            WHERE category = $1 
              AND id != $2 
              AND status = 'active'
              AND authentication_status = 'verified'
            ORDER BY created_at DESC
            LIMIT 6
        `, [artefact.category, artefactId]);
        
        res.json({
            success: true,
            artefact,
            similar_artefacts: similar.rows
        });
    } catch (error) {
        console.error('Error fetching artefact:', error);
        res.status(500).json({ error: 'Failed to fetch artefact' });
    }
});

// ============================================
// CREATE NEW ARTEFACT (Artisan only)
// ============================================
router.post('/', 
    authenticate, 
    requireArtisan,
    upload.array('images', 12),
    [
        body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }),
        body('description').notEmpty().withMessage('Description is required'),
        body('category').notEmpty().withMessage('Category is required'),
        body('local_price').isNumeric().withMessage('Local price must be a number'),
        body('foreign_price_usd').isNumeric().withMessage('Foreign price must be a number'),
        body('country').notEmpty().withMessage('Country is required')
    ],
    async (req, res) => {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        try {
            // Check if user is verified to sell
            if (!req.user.id_verified && req.user.user_type !== 'admin') {
                return res.status(403).json({ 
                    error: 'Your account must be verified before you can list artefacts',
                    verification_required: true
                });
            }
            
            // Upload images to S3
            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                imageUrls = req.files.map(file => file.location || file.path);
            } else {
                return res.status(400).json({ error: 'At least one image is required' });
            }
            
            const {
                title,
                description,
                short_description,
                tribe_origin,
                country,
                region,
                category,
                sub_category,
                local_price,
                foreign_price_usd,
                negotiable_local = true,
                negotiable_foreign = false,
                minimum_offer_local,
                minimum_offer_foreign,
                weight_kg,
                dimensions_cm,
                materials,
                condition = 'good',
                year_created,
                era,
                historical_significance,
                fragile = true,
                restricted_export = false,
                customs_hs_code,
                requires_export_permit = false
            } = req.body;
            
            // Create artefact
            const newArtefact = await query(`
                INSERT INTO artefacts (
                    artisan_id, title, description, short_description,
                    tribe_origin, country, region, category, sub_category,
                    local_price, foreign_price_usd, negotiable_local, negotiable_foreign,
                    minimum_offer_local, minimum_offer_foreign,
                    main_image_url, gallery_image_urls,
                    weight_kg, dimensions_cm, materials, condition,
                    year_created, era, historical_significance,
                    fragile, restricted_export, customs_hs_code, requires_export_permit,
                    status, authentication_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
                RETURNING *
            `, [
                req.user.id, title, description, short_description,
                tribe_origin, country, region, category, sub_category,
                parseFloat(local_price), parseFloat(foreign_price_usd), 
                negotiable_local === 'true' || negotiable_local === true,
                negotiable_foreign === 'true' || negotiable_foreign === false,
                minimum_offer_local ? parseFloat(minimum_offer_local) : null,
                minimum_offer_foreign ? parseFloat(minimum_offer_foreign) : null,
                imageUrls[0], imageUrls,
                weight_kg ? parseFloat(weight_kg) : null,
                dimensions_cm ? JSON.parse(dimensions_cm) : null,
                materials ? (Array.isArray(materials) ? materials : materials.split(',')) : [],
                condition,
                year_created, era, historical_significance,
                fragile === 'true' || fragile === true,
                restricted_export === 'true' || restricted_export === false,
                customs_hs_code,
                requires_export_permit === 'true' || requires_export_permit === false,
                'pending_review',
                'pending'
            ]);
            
            // Notify admin about new artefact for review
            await query(`
                INSERT INTO notifications (user_id, type, title, body, data)
                SELECT id, 'new_artefact', 'New Artefact Pending Review', 
                       '${req.user.full_name} listed "${title}" for review',
                       '{"artefact_id": "${newArtefact.rows[0].id}"}'
                FROM users WHERE user_type = 'admin'
            `);
            
            res.status(201).json({
                success: true,
                message: 'Artefact created successfully and pending review',
                artefact: newArtefact.rows[0]
            });
        } catch (error) {
            console.error('Error creating artefact:', error);
            res.status(500).json({ error: 'Failed to create artefact', details: error.message });
        }
    }
);

// ============================================
// UPDATE ARTEFACT (Artisan only)
// ============================================
router.put('/:id', authenticate, requireArtisan, async (req, res) => {
    try {
        const artefactId = req.params.id;
        
        // Check ownership
        const checkResult = await query(
            'SELECT artisan_id, status FROM artefacts WHERE id = $1',
            [artefactId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        
        if (checkResult.rows[0].artisan_id !== req.user.id && req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'You can only edit your own artefacts' });
        }
        
        // Don't allow editing of sold items
        if (checkResult.rows[0].status === 'sold') {
            return res.status(400).json({ error: 'Cannot edit a sold artefact' });
        }
        
        const allowedUpdates = [
            'title', 'description', 'short_description', 'tribe_origin',
            'country', 'region', 'category', 'sub_category', 'local_price',
            'foreign_price_usd', 'negotiable_local', 'negotiable_foreign',
            'minimum_offer_local', 'minimum_offer_foreign', 'weight_kg',
            'dimensions_cm', 'materials', 'condition', 'year_created',
            'era', 'historical_significance', 'fragile', 'restricted_export',
            'customs_hs_code', 'requires_export_permit'
        ];
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        for (const field of allowedUpdates) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = $${paramCount++}`);
                
                // Parse special fields
                let value = req.body[field];
                if (field === 'local_price' || field === 'foreign_price_usd' || 
                    field === 'minimum_offer_local' || field === 'minimum_offer_foreign' ||
                    field === 'weight_kg') {
                    value = parseFloat(value);
                } else if (field === 'dimensions_cm' && typeof value === 'string') {
                    value = JSON.parse(value);
                } else if (field === 'materials' && typeof value === 'string') {
                    value = value.split(',');
                } else if (field === 'negotiable_local' || field === 'negotiable_foreign' ||
                           field === 'fragile' || field === 'restricted_export' ||
                           field === 'requires_export_permit') {
                    value = value === 'true' || value === true;
                }
                
                values.push(value);
            }
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        updates.push(`updated_at = NOW()`);
        updates.push(`authentication_status = 'pending'`); // Reset authentication on edit
        values.push(artefactId);
        
        const result = await query(
            `UPDATE artefacts SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        
        res.json({
            success: true,
            message: 'Artefact updated successfully and pending re-review',
            artefact: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating artefact:', error);
        res.status(500).json({ error: 'Failed to update artefact' });
    }
});

// ============================================
// DELETE ARTEFACT (Soft delete)
// ============================================
router.delete('/:id', authenticate, requireArtisan, async (req, res) => {
    try {
        const artefactId = req.params.id;
        
        const checkResult = await query(
            'SELECT artisan_id, status FROM artefacts WHERE id = $1',
            [artefactId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        
        if (checkResult.rows[0].artisan_id !== req.user.id && req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own artefacts' });
        }
        
        await query(
            `UPDATE artefacts SET status = 'inactive', archived_at = NOW(), updated_at = NOW() 
             WHERE id = $1`,
            [artefactId]
        );
        
        res.json({
            success: true,
            message: 'Artefact deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting artefact:', error);
        res.status(500).json({ error: 'Failed to delete artefact' });
    }
});

// ============================================
// SAVE/UNSAVE ARTEFACT (Wishlist)
// ============================================
router.post('/:id/save', authenticate, async (req, res) => {
    try {
        const artefactId = req.params.id;
        const userId = req.user.id;
        
        // Check if already saved
        const checkSaved = await query(
            'SELECT * FROM saved_items WHERE user_id = $1 AND artefact_id = $2',
            [userId, artefactId]
        );
        
        if (checkSaved.rows.length > 0) {
            // Unsave
            await query(
                'DELETE FROM saved_items WHERE user_id = $1 AND artefact_id = $2',
                [userId, artefactId]
            );
            await query(
                'UPDATE artefacts SET saved_count = saved_count - 1 WHERE id = $1',
                [artefactId]
            );
            return res.json({ success: true, saved: false, message: 'Removed from wishlist' });
        } else {
            // Save
            await query(
                'INSERT INTO saved_items (user_id, artefact_id) VALUES ($1, $2)',
                [userId, artefactId]
            );
            await query(
                'UPDATE artefacts SET saved_count = saved_count + 1 WHERE id = $1',
                [artefactId]
            );
            return res.json({ success: true, saved: true, message: 'Added to wishlist' });
        }
    } catch (error) {
        console.error('Error toggling save:', error);
        res.status(500).json({ error: 'Failed to save/unsave artefact' });
    }
});

// ============================================
// GET SAVED ARTEFACTS (User's wishlist)
// ============================================
router.get('/saved/my', authenticate, async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                a.*,
                u.full_name as artisan_name,
                u.rating as artisan_rating,
                si.saved_at
            FROM saved_items si
            JOIN artefacts a ON si.artefact_id = a.id
            JOIN users u ON a.artisan_id = u.id
            WHERE si.user_id = $1 AND a.status = 'active'
            ORDER BY si.saved_at DESC
        `, [req.user.id]);
        
        res.json({
            success: true,
            saved_artefacts: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching saved artefacts:', error);
        res.status(500).json({ error: 'Failed to fetch saved artefacts' });
    }
});

// ============================================
// GET ARTEFACTS BY ARTISAN (Public)
// ============================================
router.get('/artisan/:artisanId', optionalAuth, async (req, res) => {
    try {
        const { artisanId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Get artisan info first
        const artisanInfo = await query(`
            SELECT id, full_name, rating, total_sales, profile_picture_url, 
                   bio, id_verified, created_at
            FROM users WHERE id = $1 AND is_active = true
        `, [artisanId]);
        
        if (artisanInfo.rows.length === 0) {
            return res.status(404).json({ error: 'Artisan not found' });
        }
        
        // Get their artefacts
        const artefacts = await query(`
            SELECT 
                id, title, main_image_url, local_price, foreign_price_usd,
                category, tribe_origin, views_count, created_at,
                authentication_status
            FROM artefacts
            WHERE artisan_id = $1 AND status = 'active'
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [artisanId, parseInt(limit), offset]);
        
        const countResult = await query(
            'SELECT COUNT(*) FROM artefacts WHERE artisan_id = $1 AND status = $2',
            [artisanId, 'active']
        );
        
        res.json({
            success: true,
            artisan: artisanInfo.rows[0],
            artefacts: artefacts.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching artisan artefacts:', error);
        res.status(500).json({ error: 'Failed to fetch artisan artefacts' });
    }
});

// ============================================
// GET FEATURED ARTEFACTS (Homepage)
// ============================================
router.get('/featured/all', optionalAuth, async (req, res) => {
    try {
        // Get trending artefacts (most viewed in last 7 days)
        const trending = await query(`
            SELECT 
                a.id, a.title, a.main_image_url, a.local_price, a.foreign_price_usd,
                a.category, a.tribe_origin, a.views_count,
                u.full_name as artisan_name
            FROM artefacts a
            JOIN users u ON a.artisan_id = u.id
            WHERE a.status = 'active' 
              AND a.authentication_status = 'verified'
              AND a.created_at > NOW() - INTERVAL '30 days'
            ORDER BY a.views_count DESC
            LIMIT 10
        `);
        
        // Get newly listed
        const newListings = await query(`
            SELECT 
                a.id, a.title, a.main_image_url, a.local_price, a.foreign_price_usd,
                a.category, a.tribe_origin, a.created_at,
                u.full_name as artisan_name
            FROM artefacts a
            JOIN users u ON a.artisan_id = u.id
            WHERE a.status = 'active' 
              AND a.authentication_status = 'verified'
            ORDER BY a.created_at DESC
            LIMIT 10
        `);
        
        // Get highly rated artefacts
        const topRated = await query(`
            SELECT 
                a.id, a.title, a.main_image_url, a.local_price, a.foreign_price_usd,
                a.category, a.tribe_origin,
                u.full_name as artisan_name, u.rating as artisan_rating
            FROM artefacts a
            JOIN users u ON a.artisan_id = u.id
            WHERE a.status = 'active' 
              AND a.authentication_status = 'verified'
              AND u.rating >= 4.5
            ORDER BY u.rating DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            trending: trending.rows,
            new_listings: newListings.rows,
            top_rated: topRated.rows
        });
    } catch (error) {
        console.error('Error fetching featured artefacts:', error);
        res.status(500).json({ error: 'Failed to fetch featured artefacts' });
    }
});

// ============================================
// ADMIN: GET PENDING ARTEFACTS (For review)
// ============================================
router.get('/admin/pending', authenticate, requireArtisan, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const result = await query(`
            SELECT 
                a.*,
                u.full_name as artisan_name,
                u.phone_number as artisan_phone,
                u.email as artisan_email,
                u.id_verified as artisan_verified
            FROM artefacts a
            JOIN users u ON a.artisan_id = u.id
            WHERE a.authentication_status = 'pending' 
               OR a.authentication_status = 'expert_review'
            ORDER BY a.created_at ASC
        `);
        
        res.json({
            success: true,
            pending_artefacts: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching pending artefacts:', error);
        res.status(500).json({ error: 'Failed to fetch pending artefacts' });
    }
});

// ============================================
// ADMIN: APPROVE/REJECT ARTEFACT
// ============================================
router.put('/admin/:id/verify', authenticate, requireArtisan, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { id } = req.params;
        const { status, notes } = req.body; // status: 'verified' or 'rejected'
        
        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Use "verified" or "rejected"' });
        }
        
        const result = await query(`
            UPDATE artefacts 
            SET authentication_status = $1, 
                authentication_notes = $2,
                authenticated_by = $3,
                authentication_date = NOW(),
                status = CASE WHEN $1 = 'verified' THEN 'active' ELSE status END,
                published_at = CASE WHEN $1 = 'verified' THEN NOW() ELSE published_at END
            WHERE id = $4
            RETURNING *, (SELECT artisan_id FROM artefacts WHERE id = $4) as artisan_id
        `, [status, notes, req.user.id, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        
        // Notify artisan
        await createNotification(
            result.rows[0].artisan_id,
            'artefact_review',
            status === 'verified' ? 'Artefact Approved!' : 'Artefact Rejected',
            status === 'verified' 
                ? 'Your artefact has been approved and is now live on the marketplace.'
                : `Your artefact was not approved. Reason: ${notes || 'Please check your listing and resubmit.'}`,
            { artefact_id: id, status }
        );
        
        res.json({
            success: true,
            message: `Artefact ${status === 'verified' ? 'approved' : 'rejected'} successfully`,
            artefact: result.rows[0]
        });
    } catch (error) {
        console.error('Error verifying artefact:', error);
        res.status(500).json({ error: 'Failed to verify artefact' });
    }
});

// ============================================
// REPORT ARTEFACT (Flag inappropriate content)
// ============================================
router.post('/:id/report', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, description } = req.body;
        
        const validReasons = ['fake', 'stolen', 'offensive', 'wrong_category', 'other'];
        if (!validReasons.includes(reason)) {
            return res.status(400).json({ error: 'Invalid report reason' });
        }
        
        // Check if artefact exists
        const artefact = await query(
            'SELECT id, title, artisan_id FROM artefacts WHERE id = $1',
            [id]
        );
        
        if (artefact.rows.length === 0) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        
        // Create report
        await query(`
            INSERT INTO reports (artefact_id, reporter_id, reason, description, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [id, req.user.id, reason, description]);
        
        // Notify admin
        await query(`
            INSERT INTO notifications (user_id, type, title, body, data)
            SELECT id, 'report', 'Artefact Reported', 
                   'Artefact "${artefact.rows[0].title}" has been reported for: ${reason}',
                   '{"artefact_id": "${id}"}'
            FROM users WHERE user_type = 'admin'
        `);
        
        res.json({
            success: true,
            message: 'Artefact reported successfully. Our team will review it.'
        });
    } catch (error) {
        console.error('Error reporting artefact:', error);
        res.status(500).json({ error: 'Failed to report artefact' });
    }
});

// ============================================
// GET CATEGORIES WITH COUNTS
// ============================================
router.get('/categories/all', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                c.name,
                c.slug,
                c.icon_url,
                COUNT(a.id) as artefact_count
            FROM categories c
            LEFT JOIN artefacts a ON c.name ILIKE a.category AND a.status = 'active'
            WHERE c.is_active = true
            GROUP BY c.name, c.slug, c.icon_url
            ORDER BY c.sort_order ASC
        `);
        
        res.json({
            success: true,
            categories: result.rows
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

module.exports = router;