import { login, register } from './api.js';

export function showAuthOverlay(onSuccess: () => void): void {
  const overlay = document.getElementById('auth-overlay')!;
  const form = document.getElementById('auth-form') as HTMLFormElement;
  const emailInput = document.getElementById('auth-email') as HTMLInputElement;
  const passwordInput = document.getElementById('auth-password') as HTMLInputElement;
  const toggleBtn = document.getElementById('auth-toggle') as HTMLButtonElement;
  const submitBtn = document.getElementById('auth-submit') as HTMLButtonElement;
  const errorEl = document.getElementById('auth-error')!;

  let isLogin = true;

  function updateMode(): void {
    submitBtn.textContent = isLogin ? 'Log In' : 'Sign Up';
    toggleBtn.textContent = isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in';
    errorEl.textContent = '';
  }

  toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    updateMode();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    submitBtn.disabled = true;

    try {
      if (isLogin) {
        await login(emailInput.value, passwordInput.value);
      } else {
        await register(emailInput.value, passwordInput.value);
      }
      overlay.classList.add('hidden');
      onSuccess();
    } catch (err) {
      errorEl.textContent = (err as Error).message;
    } finally {
      submitBtn.disabled = false;
    }
  });

  updateMode();
  overlay.classList.remove('hidden');
}
