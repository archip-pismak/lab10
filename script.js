// Отримання елементів DOM
const cartIdInput = document.getElementById('cartId');
const loadBtn = document.getElementById('loadBtn');
const testFailModeCheckbox = document.getElementById('testFailMode');

const statusArea = document.getElementById('statusArea');
const errorArea = document.getElementById('errorArea');
const cartDataBlock = document.getElementById('cartData');

const displayCartId = document.getElementById('displayCartId');
const productsBody = document.getElementById('productsBody');
const totalAmount = document.getElementById('totalAmount');

// Функція затримки (sleep)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Функція базового запиту через Fetch API з таймаутом
async function loadCart(cartId, isFirstAttempt, testFailMode) {
  // Симуляція помилки клієнта для 1-ї спроби (Етап 5)
  if (isFirstAttempt && testFailMode) {
    throw new Error('Штучна помилка клієнта на першій спробі (Тестовий режим)');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000); // Таймаут 7 сек

  try {
    // Симуляція відкладеної відповіді сервера (3 секунди)
    const response = await fetch(`https://dummyjson.com/carts/${cartId}?delay=3000`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Обробка HTTP-помилок (Етап 4)
    if (!response.ok) {
      throw new Error(`HTTP помилка! Статус: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Превищено час очікування відповіді (Timeout)');
    }
    throw err;
  }
}

// Функція з повторними спробами (Етап 5)
async function requestWithRetry(cartId) {
  const maxAttempts = 2;
  const testFailMode = testFailModeCheckbox.checked;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      showStatus(`Завантаження кошика... Будь ласка, зачекайте. (Спроба ${attempt} із ${maxAttempts})`);
      
      const data = await loadCart(cartId, attempt === 1, testFailMode);
      return data; // Повертаємо дані при успіху
    } catch (error) {
      if (attempt < maxAttempts) {
        showStatus(`Спроба ${attempt} невдала: ${error.message}. Пауза 1 сек перед спробою 2...`);
        await delay(1000);
      } else {
        throw error; // Якщо всі спроби вичерпано, кидаємо помилку далі
      }
    }
  }
}

// Головна функція обробки кліку
async function handleLoadCart() {
  const cartId = cartIdInput.value.trim();

  if (!cartId || cartId < 1) {
    showError('Будь ласка, введіть коректний ID кошика.');
    return;
  }

  // Очищення попереднього стану
  resetUI();
  setLoadingState(true);

  try {
    const cart = await requestWithRetry(cartId);
    renderCart(cart);
  } catch (error) {
    showError(`Не вдалося завантажити кошик після 2 спроб. Помилка: ${error.message}`);
  } finally {
    setLoadingState(false);
    hideStatus();
  }
}

// Допоміжні функції роботи з UI
function renderCart(cart) {
  displayCartId.textContent = cart.id;
  productsBody.innerHTML = '';

  cart.products.forEach(product => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.title}</td>
      <td>$${product.price}</td>
      <td>${product.quantity}</td>
      <td>$${product.total}</td>
    `;
    productsBody.appendChild(row);
  });

  totalAmount.textContent = cart.total;
  cartDataBlock.classList.remove('hidden');
}

function setLoadingState(isLoading) {
  loadBtn.disabled = isLoading;
  cartIdInput.disabled = isLoading;
  testFailModeCheckbox.disabled = isLoading;
}

function showStatus(text) {
  statusArea.textContent = text;
  statusArea.style.display = 'block';
}

function hideStatus() {
  statusArea.style.display = 'none';
}

function showError(text) {
  errorArea.textContent = text;
  errorArea.style.display = 'block';
}

function resetUI() {
  hideStatus();
  errorArea.style.display = 'none';
  cartDataBlock.classList.add('hidden');
}

// Прив'язка події
loadBtn.addEventListener('click', handleLoadCart);