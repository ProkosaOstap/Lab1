// ==================== ОСНОВНІ ФУНКЦІЇ ====================

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      'Помилка виконання запиту'
    );
  }

  return data;
}

function showMessage(text, isError = false) {
  const element = document.getElementById('message');

  if (!element) {
    alert(text);
    return;
  }

  element.textContent = text;
  element.style.display = 'block';
  element.style.background = isError
    ? '#fee2e2'
    : '#dcfce7';
  element.style.color = isError
    ? '#991b1b'
    : '#166534';

  setTimeout(() => {
    element.style.display = 'none';
  }, 4000);
}

function money(value) {
  return Number(value).toLocaleString('uk-UA') + ' $';
}

function renderEmpty(element, text = 'Записів поки немає') {
  element.innerHTML = `
    <div class="empty">${text}</div>
  `;
}

function formDataToObject(form) {
  const data = Object.fromEntries(new FormData(form));

  Object.keys(data).forEach(key => {
    if (
      key.endsWith('Id') ||
      key === 'productionYear' ||
      key === 'basePrice' ||
      key === 'price' ||
      key === 'finalPrice' ||
      key === 'releaseYear'
    ) {
      data[key] = Number(data[key]);
    }
  });

  return data;
}

async function deleteRecord(type, id, reloadFunction) {
  const confirmed = confirm(
    'Ви впевнені, що хочете видалити цей запис?'
  );

  if (!confirmed) {
    return;
  }

  try {
    await request(`/${type}/${id}`, {
      method: 'DELETE'
    });

    showMessage('Запис успішно видалено');
    await reloadFunction();
  } catch (error) {
    showMessage(error.message, true);
  }
}

// ==================== ГОЛОВНА СТОРІНКА ====================

async function loadHome() {
  try {
    const [
      vehicles,
      clients,
      configurations,
      sales
    ] = await Promise.all([
      request('/vehicles'),
      request('/clients'),
      request('/configurations'),
      request('/sales')
    ]);

    const vehiclesCount =
      document.getElementById('vehiclesCount');

    const clientsCount =
      document.getElementById('clientsCount');

    const configurationsCount =
      document.getElementById('configurationsCount');

    const salesCount =
      document.getElementById('salesCount');

    if (vehiclesCount) {
      vehiclesCount.textContent = vehicles.length;
    }

    if (clientsCount) {
      clientsCount.textContent = clients.length;
    }

    if (configurationsCount) {
      configurationsCount.textContent =
        configurations.length;
    }

    if (salesCount) {
      salesCount.textContent = sales.length;
    }
  } catch (error) {
    console.error(error);
  }
}

// ==================== КЛІЄНТИ ====================

async function loadClients() {
  const clients = await request('/clients');
  const list = document.getElementById('clientsList');

  if (!list) {
    return;
  }

  if (clients.length === 0) {
    renderEmpty(list, 'Клієнтів поки немає');
    return;
  }

  list.innerHTML = clients.map(client => `
    <div class="record">
      <strong>
        ${client.firstName} ${client.lastName}
      </strong>

      <small>
        Телефон: ${client.phone}
        ${client.email
          ? ` | Email: ${client.email}`
          : ''
        }
        ${client.address
          ? ` | Адреса: ${client.address}`
          : ''
        }
      </small>

      <div class="record-actions">
        <button
          class="button edit"
          onclick="editClient(${client.id})">
          Редагувати
        </button>

        <button
          class="button delete"
          onclick="deleteRecord(
            'clients',
            ${client.id},
            loadClients
          )">
          Видалити
        </button>
      </div>
    </div>
  `).join('');
}

async function editClient(id) {
  try {
    const clients = await request('/clients');
    const client = clients.find(item => item.id === id);

    if (!client) {
      return;
    }

    const firstName = prompt(
      'Ім’я:',
      client.firstName
    );

    if (firstName === null) return;

    const lastName = prompt(
      'Прізвище:',
      client.lastName
    );

    if (lastName === null) return;

    const phone = prompt(
      'Телефон:',
      client.phone
    );

    if (phone === null) return;

    const email = prompt(
      'Email:',
      client.email || ''
    );

    if (email === null) return;

    const address = prompt(
      'Адреса:',
      client.address || ''
    );

    if (address === null) return;

    await request(`/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        email: email || null,
        address: address || null
      })
    });

    showMessage('Клієнта успішно оновлено');
    await loadClients();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function initClients() {
  await loadClients();

  const form = document.getElementById('clientForm');

  if (!form) {
    return;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    try {
      const data = formDataToObject(form);

      await request('/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      form.reset();

      showMessage('Клієнта успішно додано');
      await loadClients();
    } catch (error) {
      showMessage(error.message, true);
    }
  });
}

// ==================== КОМПЛЕКТАЦІЇ ====================

async function loadModelsToSelect() {
  const models = await request('/models');
  const select = document.getElementById('modelSelect');

  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">Оберіть модель</option>
  `;

  models.forEach(model => {
    const option = document.createElement('option');

    option.value = model.id;
    option.textContent =
      `${model.Brand?.name || ''} ${model.name}`;

    select.appendChild(option);
  });
}

async function loadConfigurations() {
  const configurations = await request('/configurations');
  const list = document.getElementById(
    'configurationsList'
  );

  if (!list) {
    return;
  }

  if (configurations.length === 0) {
    renderEmpty(list, 'Комплектацій поки немає');
    return;
  }

  list.innerHTML = configurations.map(configuration => `
    <div class="record">
      <strong>
        ${configuration.name}
      </strong>

      <small>
        Двигун: ${configuration.engine} |
        КПП: ${configuration.transmission} |
        Пальне: ${configuration.fuelType} |
        Ціна: ${money(configuration.basePrice)}
      </small>

      <div class="record-actions">
        <button
          class="button edit"
          onclick="editConfiguration(
            ${configuration.id}
          )">
          Редагувати
        </button>

        <button
          class="button delete"
          onclick="deleteRecord(
            'configurations',
            ${configuration.id},
            loadConfigurations
          )">
          Видалити
        </button>
      </div>
    </div>
  `).join('');
}

async function editConfiguration(id) {
  try {
    const configurations = await request(
      '/configurations'
    );

    const configuration = configurations.find(
      item => item.id === id
    );

    if (!configuration) {
      return;
    }

    const name = prompt(
      'Назва комплектації:',
      configuration.name
    );

    if (name === null) return;

    const engine = prompt(
      'Двигун:',
      configuration.engine
    );

    if (engine === null) return;

    const transmission = prompt(
      'Коробка передач:',
      configuration.transmission
    );

    if (transmission === null) return;

    const fuelType = prompt(
      'Тип пального:',
      configuration.fuelType
    );

    if (fuelType === null) return;

    const basePrice = prompt(
      'Базова ціна:',
      configuration.basePrice
    );

    if (basePrice === null) return;

    await request(`/configurations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        engine,
        transmission,
        fuelType,
        basePrice: Number(basePrice)
      })
    });

    showMessage('Комплектацію оновлено');
    await loadConfigurations();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function initConfigurations() {
  try {
    await loadModelsToSelect();
    await loadConfigurations();

    const form = document.getElementById(
      'configurationForm'
    );

    if (!form) {
      return;
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();

      try {
        const data = formDataToObject(form);

        await request('/configurations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        form.reset();

        showMessage('Комплектацію успішно додано');
        await loadConfigurations();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  } catch (error) {
    showMessage(
      'Спочатку додайте модель автомобіля',
      true
    );
  }
}

// ==================== АВТОМОБІЛІ ====================

let allModels = [];
let allConfigurations = [];

async function loadBrandsToSelect() {
  const brands = await request('/brands');
  const select = document.getElementById('brandSelect');

  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">Оберіть марку</option>
  `;

  brands.forEach(brand => {
    const option = document.createElement('option');

    option.value = brand.id;
    option.textContent = brand.name;

    select.appendChild(option);
  });
}

async function loadModelsForCars() {
  allModels = await request('/models');
}

async function loadConfigurationsForCars() {
  allConfigurations = await request(
    '/configurations'
  );
}

function setupCarSelects() {
  const brandSelect =
    document.getElementById('brandSelect');

  const modelSelect =
    document.getElementById('modelSelect');

  const configurationSelect =
    document.getElementById('configurationSelect');

  if (
    !brandSelect ||
    !modelSelect ||
    !configurationSelect
  ) {
    return;
  }

  brandSelect.addEventListener('change', () => {
    const brandId = Number(brandSelect.value);

    modelSelect.innerHTML = `
      <option value="">Оберіть модель</option>
    `;

    configurationSelect.innerHTML = `
      <option value="">
        Спочатку оберіть модель
      </option>
    `;

    modelSelect.disabled = true;
    configurationSelect.disabled = true;

    if (!brandId) {
      return;
    }

    const models = allModels.filter(model => {
      return Number(model.brandId) === brandId ||
        Number(model.BrandId) === brandId;
    });

    models.forEach(model => {
      const option = document.createElement('option');

      option.value = model.id;
      option.textContent = model.name;

      modelSelect.appendChild(option);
    });

    modelSelect.disabled = false;
  });

  modelSelect.addEventListener('change', () => {
    const modelId = Number(modelSelect.value);

    configurationSelect.innerHTML = `
      <option value="">
        Оберіть комплектацію
      </option>
    `;

    configurationSelect.disabled = true;

    if (!modelId) {
      return;
    }

    const configurations = allConfigurations.filter(
      configuration => {
        return Number(configuration.carModelId) === modelId ||
          Number(configuration.CarModelId) === modelId;
      }
    );

    configurations.forEach(configuration => {
      const option = document.createElement('option');

      option.value = configuration.id;
      option.textContent =
        `${configuration.name} — ` +
        `${configuration.engine}`;

      configurationSelect.appendChild(option);
    });

    configurationSelect.disabled = false;
  });
}

async function loadVehicles() {
  const vehicles = await request('/vehicles');
  const list = document.getElementById('vehiclesList');

  if (!list) {
    return;
  }

  if (vehicles.length === 0) {
    renderEmpty(list, 'Автомобілів поки немає');
    return;
  }

  list.innerHTML = vehicles.map(vehicle => {
    const configuration = vehicle.Configuration;
    const model = configuration?.CarModel;
    const brand = model?.Brand;

    return `
      <div class="record">
        <strong>
          ${brand?.name || 'Без марки'}
          ${model?.name || 'Без моделі'}
        </strong>

        <small>
          Комплектація:
          ${configuration?.name || '-'}
          <br>

          Двигун:
          ${configuration?.engine || '-'}
          <br>

          Колір:
          ${vehicle.color}
          <br>

          Рік виробництва:
          ${vehicle.productionYear}
          <br>

          Ціна:
          ${money(vehicle.price)}
          <br>

          Статус:
          ${vehicle.status}
        </small>

        <div class="record-actions">
          <button
            class="button edit"
            onclick="editVehicle(${vehicle.id})">
            Редагувати
          </button>

          <button
            class="button delete"
            onclick="deleteRecord(
              'vehicles',
              ${vehicle.id},
              loadVehicles
            )">
            Видалити
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function editVehicle(id) {
  try {
    const vehicles = await request('/vehicles');
    const vehicle = vehicles.find(item => item.id === id);

    if (!vehicle) {
      return;
    }

    const color = prompt(
      'Колір:',
      vehicle.color
    );

    if (color === null) return;

    const productionYear = prompt(
      'Рік виробництва:',
      vehicle.productionYear
    );

    if (productionYear === null) return;

    const price = prompt(
      'Ціна автомобіля:',
      vehicle.price
    );

    if (price === null) return;

    const status = prompt(
      'Статус: available, reserved або sold',
      vehicle.status
    );

    if (status === null) return;

    const allowedStatuses = [
      'available',
      'reserved',
      'sold'
    ];

    if (!allowedStatuses.includes(status)) {
      showMessage(
        'Неправильний статус автомобіля',
        true
      );

      return;
    }

    await request(`/vehicles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        color,
        productionYear: Number(productionYear),
        price: Number(price),
        status
      })
    });

    showMessage('Автомобіль оновлено');
    await loadVehicles();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function initCars() {
  try {
    await loadBrandsToSelect();
    await loadModelsForCars();
    await loadConfigurationsForCars();

    setupCarSelects();
    await loadVehicles();

    const form = document.getElementById(
      'vehicleForm'
    );

    if (!form) {
      return;
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();

      try {
        const data = formDataToObject(form);

        // Марка використовується лише
        // для фільтрації моделей
        delete data.modelId;

        await request('/vehicles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        form.reset();

        const modelSelect =
          document.getElementById('modelSelect');

        const configurationSelect =
          document.getElementById(
            'configurationSelect'
          );

        if (modelSelect) {
          modelSelect.disabled = true;
        }

        if (configurationSelect) {
          configurationSelect.disabled = true;
        }

        showMessage('Автомобіль успішно додано');
        await loadVehicles();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  } catch (error) {
    showMessage(error.message, true);
  }
}

// ==================== ПРОДАЖІ ====================

let saleVehicles = [];
let saleConfigurations = [];

async function loadClientsToSelect() {
  const clients = await request('/clients');
  const select = document.getElementById(
    'clientSelect'
  );

  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">Оберіть клієнта</option>
  `;

  clients.forEach(client => {
    const option = document.createElement('option');

    option.value = client.id;
    option.textContent =
      `${client.firstName} ` +
      `${client.lastName} — ` +
      `${client.phone}`;

    select.appendChild(option);
  });
}

async function loadVehiclesToSaleSelect() {
  saleVehicles = await request('/vehicles');

  const select = document.getElementById(
    'vehicleSelect'
  );

  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">Оберіть автомобіль</option>
  `;

  saleVehicles
    .filter(vehicle => vehicle.status === 'available')
    .forEach(vehicle => {
      const configuration = vehicle.Configuration;
      const model = configuration?.CarModel;
      const brand = model?.Brand;

      const option = document.createElement('option');

      option.value = vehicle.id;

      option.textContent =
        `${brand?.name || ''} ` +
        `${model?.name || ''} — ` +
        `${vehicle.color} — ` +
        `${money(vehicle.price)}`;

      select.appendChild(option);
    });
}

async function loadConfigurationsToSaleSelect() {
  saleConfigurations = await request(
    '/configurations'
  );

  const select = document.getElementById(
    'saleConfigurationSelect'
  );

  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">
      Оберіть комплектацію
    </option>
  `;

  saleConfigurations.forEach(configuration => {
    const option = document.createElement('option');

    option.value = configuration.id;

    option.textContent =
      `${configuration.name} — ` +
      `${money(configuration.basePrice)}`;

    select.appendChild(option);
  });
}

function calculateFinalPrice() {
  const vehicleSelect =
    document.getElementById('vehicleSelect');

  const configurationSelect =
    document.getElementById(
      'saleConfigurationSelect'
    );

  const vehiclePriceInput =
    document.getElementById('vehiclePrice');

  const configurationPriceInput =
    document.getElementById(
      'configurationPrice'
    );

  const finalPriceInput =
    document.getElementById('finalPrice');

  if (
    !vehicleSelect ||
    !configurationSelect ||
    !vehiclePriceInput ||
    !configurationPriceInput ||
    !finalPriceInput
  ) {
    return;
  }

  const vehicleId = Number(vehicleSelect.value);
  const configurationId =
    Number(configurationSelect.value);

  const vehicle = saleVehicles.find(item => {
    return item.id === vehicleId;
  });

  const configuration = saleConfigurations.find(
    item => item.id === configurationId
  );

  const vehiclePrice = vehicle
    ? Number(vehicle.price)
    : 0;

  const configurationPrice = configuration
    ? Number(configuration.basePrice)
    : 0;

  vehiclePriceInput.value = vehicle
    ? money(vehiclePrice)
    : '';

  configurationPriceInput.value = configuration
    ? money(configurationPrice)
    : '';

  finalPriceInput.value =
    vehicle && configuration
      ? vehiclePrice + configurationPrice
      : '';
}

async function loadSales() {
  const sales = await request('/sales');
  const list = document.getElementById(
    'salesList'
  );

  if (!list) {
    return;
  }

  if (sales.length === 0) {
    renderEmpty(list, 'Продажів поки немає');
    return;
  }

  list.innerHTML = sales.map(sale => {
    const configuration = sale.Configuration;
    const model = configuration?.CarModel;
    const brand = model?.Brand;

    return `
      <div class="record">
        <strong>
          Продаж №${sale.id} —
          ${money(sale.finalPrice)}
        </strong>

        <small>
          Клієнт:
          ${sale.Client?.firstName || '-'}
          ${sale.Client?.lastName || '-'}
          <br>

          Автомобіль:
          ${sale.Vehicle?.color || '-'}
          <br>

          Марка:
          ${brand?.name || '-'}
          <br>

          Модель:
          ${model?.name || '-'}
          <br>

          Комплектація:
          ${configuration?.name || '-'}
          <br>

          Оплата:
          ${sale.paymentType}
          <br>

          Статус:
          ${sale.status}
        </small>

        <div class="record-actions">
          <button
            class="button edit"
            onclick="editSale(${sale.id})">
            Редагувати
          </button>

          <button
            class="button delete"
            onclick="deleteRecord(
              'sales',
              ${sale.id},
              loadSales
            )">
            Видалити
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function editSale(id) {
  try {
    const sales = await request('/sales');
    const sale = sales.find(item => item.id === id);

    if (!sale) {
      return;
    }

    const finalPrice = prompt(
      'Фінальна ціна:',
      sale.finalPrice
    );

    if (finalPrice === null) return;

    const paymentType = prompt(
      'Спосіб оплати: cash, card, credit або leasing',
      sale.paymentType
    );

    if (paymentType === null) return;

    const status = prompt(
      'Статус: created, paid або cancelled',
      sale.status
    );

    if (status === null) return;

    const allowedPaymentTypes = [
      'cash',
      'card',
      'credit',
      'leasing'
    ];

    const allowedStatuses = [
      'created',
      'paid',
      'cancelled'
    ];

    if (!allowedPaymentTypes.includes(paymentType)) {
      showMessage(
        'Неправильний спосіб оплати',
        true
      );

      return;
    }

    if (!allowedStatuses.includes(status)) {
      showMessage(
        'Неправильний статус продажу',
        true
      );

      return;
    }

    await request(`/sales/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        finalPrice: Number(finalPrice),
        paymentType,
        status,
        configurationId: sale.configurationId
      })
    });

    showMessage('Продаж оновлено');
    await loadSales();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function initSales() {
  try {
    await loadClientsToSelect();
    await loadVehiclesToSaleSelect();
    await loadConfigurationsToSaleSelect();
    await loadSales();

    const vehicleSelect =
      document.getElementById('vehicleSelect');

    const configurationSelect =
      document.getElementById(
        'saleConfigurationSelect'
      );

    if (vehicleSelect) {
      vehicleSelect.addEventListener(
        'change',
        calculateFinalPrice
      );
    }

    if (configurationSelect) {
      configurationSelect.addEventListener(
        'change',
        calculateFinalPrice
      );
    }

    const form = document.getElementById('saleForm');

    if (!form) {
      return;
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();

      try {
        const data = formDataToObject(form);

        await request('/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        form.reset();

        const vehiclePrice =
          document.getElementById('vehiclePrice');

        const configurationPrice =
          document.getElementById(
            'configurationPrice'
          );

        const finalPrice =
          document.getElementById('finalPrice');

        if (vehiclePrice) {
          vehiclePrice.value = '';
        }

        if (configurationPrice) {
          configurationPrice.value = '';
        }

        if (finalPrice) {
          finalPrice.value = '';
        }

        showMessage('Продаж успішно оформлено');

        await loadSales();
        await loadVehiclesToSaleSelect();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  } catch (error) {
    showMessage(error.message, true);
  }
}

// ==================== ЗАПУСК ПОТРІБНОЇ СТОРІНКИ ====================

const page = window.location.pathname;

if (
  page === '/' ||
  page === '/index.html'
) {
  loadHome();
}

if (page === '/clients.html') {
  initClients();
}

if (page === '/cars.html') {
  initCars();
}

if (page === '/configurations.html') {
  initConfigurations();
}

if (page === '/sales.html') {
  initSales();
}