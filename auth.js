// === auth.js ===
export function initAuthHandlers() {
  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');
  const container = document.getElementById('container');

  document.getElementById('signupForm').addEventListener('submit', handleSignup);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
  signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));
}

function handleSignup(e) {
  e.preventDefault();
  clearErrors();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;

  let isValid = true;
  if (!name) showError('signupName', 'Name is required'), isValid = false;
  if (!email) showError('signupEmail', 'Email is required'), isValid = false;
  else if (!isValidEmail(email)) showError('signupEmail', 'Invalid email'), isValid = false;
  if (!password) showError('signupPassword', 'Password is required'), isValid = false;
  else if (password.length < 6) showError('signupPassword', 'Min 6 characters'), isValid = false;
  if (!confirmPassword) showError('signupConfirmPassword', 'Please confirm password'), isValid = false;
  else if (password !== confirmPassword) showError('signupConfirmPassword', 'Passwords do not match'), isValid = false;

  if (isValid) {
    localStorage.setItem('acnh_username', name);
    alert('Signup successful! You can now login.');
    document.getElementById('container').classList.remove("right-panel-active");
    document.getElementById('signupForm').reset();
  }
}

function handleLogin(e) {
  e.preventDefault();
  clearErrors();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  let isValid = true;
  if (!email) showError('loginEmail', 'Email is required'), isValid = false;
  else if (!isValidEmail(email)) showError('loginEmail', 'Invalid email'), isValid = false;
  if (!password) showError('loginPassword', 'Password is required'), isValid = false;

  if (isValid) {
    const savedName = localStorage.getItem('acnh_username') || email.split('@')[0];
    document.getElementById('greeting').textContent = `Hello, ${savedName}!`;
    document.getElementById('loginForm').reset();
  }
}

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.textContent = message;
  field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearErrors() {
  document.querySelectorAll('.error').forEach(err => err.remove());
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
