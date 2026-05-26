import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/api_service.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  User? _currentUser;
  bool _isLoading = false;
  String? _error;
  
  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _currentUser != null;
  
  AuthProvider() {
    _loadUserFromStorage();
  }
  
  Future<void> _loadUserFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('user');
    if (userJson != null) {
      _currentUser = User.fromJson(jsonDecode(userJson));
      notifyListeners();
    }
  }
  
  Future<bool> login(String phone, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.login(phone, password);
      
      if (response['success']) {
        _currentUser = User.fromJson(response['user']);
        
        // Save to storage
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', response['token']);
        await prefs.setString('user', jsonEncode(response['user']));
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['error'] ?? 'Login failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
  
  Future<bool> register({
    required String phone,
    required String fullName,
    required String email,
    required String password,
    required String userType,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.register({
        'phone_number': phone,
        'full_name': fullName,
        'email': email,
        'password': password,
        'user_type': userType,
      });
      
      if (response['success']) {
        _currentUser = User.fromJson(response['user']);
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', response['token']);
        await prefs.setString('user', jsonEncode(response['user']));
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['error'] ?? 'Registration failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
  
  Future<void> logout() async {
    await FirebaseAuth.instance.signOut();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    _currentUser = null;
    notifyListeners();
  }
  
  Future<bool> sendVerificationCode(String phone) async {
    try {
      final response = await _apiService.sendVerificationCode(phone);
      return response['success'];
    } catch (e) {
      return false;
    }
  }
  
  Future<bool> verifyPhone(String phone, String code) async {
    try {
      final response = await _apiService.verifyPhone(phone, code);
      if (response['success']) {
        _currentUser?.isVerified = true;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}