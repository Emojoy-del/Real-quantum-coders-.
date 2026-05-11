export async function login(form) {
  return {
    name: "User",
    email: form.email,
  };
}

export async function register(form) {
  return form;
}