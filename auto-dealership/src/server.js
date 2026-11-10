const express = require('express');
const path = require('path');
require('dotenv').config();

const {
  sequelize,
  Brand,
  CarModel,
  Configuration,
  Option,
  Vehicle,
  Client,
  Sale,
  SaleOption
} = require('./models');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ==================== ГОЛОВНА ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ==================== МАРКИ ====================

app.get('/brands', async (req, res) => {
  try {
    const brands = await Brand.findAll({
      include: CarModel
    });

    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/brands', async (req, res) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json(brand);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== МОДЕЛІ ====================

app.get('/models', async (req, res) => {
  try {
    const models = await CarModel.findAll({
      include: Brand
    });

    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/models', async (req, res) => {
  try {
    const model = await CarModel.create(req.body);
    res.status(201).json(model);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== КОМПЛЕКТАЦІЇ ====================

app.get('/configurations', async (req, res) => {
  try {
    const configurations = await Configuration.findAll({
      include: [
        {
          model: CarModel,
          include: Brand
        },
        Option
      ]
    });

    res.json(configurations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/configurations', async (req, res) => {
  try {
    const configuration = await Configuration.create(req.body);
    res.status(201).json(configuration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/configurations/:id', async (req, res) => {
  try {
    const configuration = await Configuration.findByPk(req.params.id);

    if (!configuration) {
      return res.status(404).json({
        error: 'Комплектацію не знайдено'
      });
    }

    await configuration.update({
      name: req.body.name,
      engine: req.body.engine,
      transmission: req.body.transmission,
      fuelType: req.body.fuelType,
      basePrice: req.body.basePrice,
      carModelId: req.body.carModelId || configuration.carModelId
    });

    res.json(configuration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/configurations/:id', async (req, res) => {
  try {
    const configuration = await Configuration.findByPk(req.params.id);

    if (!configuration) {
      return res.status(404).json({
        error: 'Комплектацію не знайдено'
      });
    }

    await configuration.destroy();

    res.json({
      message: 'Комплектацію видалено'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Комплектацію не можна видалити, якщо до неї прив’язані автомобілі'
    });
  }
});

// ==================== АВТОМОБІЛІ ====================

app.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      include: {
        model: Configuration,
        include: {
          model: CarModel,
          include: Brand
        }
      },
      order: [['id', 'DESC']]
    });

    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/vehicles', async (req, res) => {
  try {
    const {
      color,
      productionYear,
      price,
      status,
      configurationId
    } = req.body;

    if (!configurationId) {
      return res.status(400).json({
        error: 'Потрібно вибрати комплектацію'
      });
    }

    const configuration = await Configuration.findByPk(
      configurationId
    );

    if (!configuration) {
      return res.status(404).json({
        error: 'Комплектацію не знайдено'
      });
    }

    const vehicle = await Vehicle.create({
      color,
      productionYear,
      price,
      status: status || 'available',
      configurationId
    });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.put('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        error: 'Автомобіль не знайдено'
      });
    }

    await vehicle.update({
      color: req.body.color,
      productionYear: req.body.productionYear,
      price: req.body.price,
      status: req.body.status,
      configurationId:
        req.body.configurationId ||
        vehicle.configurationId
    });

    res.json(vehicle);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.delete('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        error: 'Автомобіль не знайдено'
      });
    }

    const sale = await Sale.findOne({
      where: {
        vehicleId: vehicle.id
      }
    });

    if (sale) {
      return res.status(400).json({
        error: 'Автомобіль не можна видалити, тому що він має продаж'
      });
    }

    await vehicle.destroy();

    res.json({
      message: 'Автомобіль видалено'
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// ==================== КЛІЄНТИ ====================

app.get('/clients', async (req, res) => {
  try {
    const clients = await Client.findAll({
      order: [['id', 'DESC']]
    });

    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/clients', async (req, res) => {
  try {
    const client = await Client.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      email: req.body.email || null,
      address: req.body.address || null
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({
        error: 'Клієнта не знайдено'
      });
    }

    await client.update({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      email: req.body.email || null,
      address: req.body.address || null
    });

    res.json(client);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({
        error: 'Клієнта не знайдено'
      });
    }

    const sale = await Sale.findOne({
      where: {
        clientId: client.id
      }
    });

    if (sale) {
      return res.status(400).json({
        error: 'Клієнта не можна видалити, тому що він має продажі'
      });
    }

    await client.destroy();

    res.json({
      message: 'Клієнта видалено'
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// ==================== ПРОДАЖІ ====================

app.get('/sales', async (req, res) => {
  try {
    const sales = await Sale.findAll({
      include: [
        Client,
        Vehicle,
        {
          model: Configuration,
          include: [
            {
              model: CarModel,
              include: [Brand]
            }
          ]
        }
      ],
      order: [['id', 'DESC']]
    });

    res.json(sales);
  } catch (error) {
    console.error('GET SALES ERROR:', error);

    res.status(500).json({
      error: error.message
    });
  }
});
app.post('/sales', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      clientId,
      vehicleId,
      configurationId,
      paymentType,
      status
    } = req.body;

    if (!clientId || !vehicleId || !configurationId) {
      await transaction.rollback();

      return res.status(400).json({
        error: 'Потрібно вибрати клієнта, автомобіль і комплектацію'
      });
    }

    const client = await Client.findByPk(clientId, {
      transaction
    });

    if (!client) {
      await transaction.rollback();

      return res.status(404).json({
        error: 'Клієнта не знайдено'
      });
    }

    const vehicle = await Vehicle.findByPk(vehicleId, {
      transaction
    });

    if (!vehicle) {
      await transaction.rollback();

      return res.status(404).json({
        error: 'Автомобіль не знайдено'
      });
    }

    if (vehicle.status !== 'available') {
      await transaction.rollback();

      return res.status(400).json({
        error: 'Цей автомобіль вже недоступний для продажу'
      });
    }

    const configuration = await Configuration.findByPk(
      configurationId,
      {
        transaction
      }
    );

    if (!configuration) {
      await transaction.rollback();

      return res.status(404).json({
        error: 'Комплектацію не знайдено'
      });
    }

    const finalPrice =
      Number(vehicle.price) +
      Number(configuration.basePrice);

    const saleStatus = status || 'created';

    const sale = await Sale.create({
      clientId: Number(clientId),
      vehicleId: Number(vehicleId),
      configurationId: Number(configurationId),
      finalPrice,
      paymentType,
      status: saleStatus
    }, {
      transaction
    });

    if (saleStatus === 'paid') {
      await vehicle.update({
        status: 'sold'
      }, {
        transaction
      });
    } else if (saleStatus === 'cancelled') {
      await vehicle.update({
        status: 'available'
      }, {
        transaction
      });
    } else {
      await vehicle.update({
        status: 'reserved'
      }, {
        transaction
      });
    }

    await transaction.commit();

    res.status(201).json({
      message: 'Продаж успішно створено',
      sale
    });
  } catch (error) {
    await transaction.rollback();

    console.error('CREATE SALE ERROR:', error);

    res.status(400).json({
      error: error.message
    });
  }
});

app.put('/sales/:id', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const sale = await Sale.findByPk(req.params.id, {
      transaction
    });

    if (!sale) {
      await transaction.rollback();

      return res.status(404).json({
        error: 'Продаж не знайдено'
      });
    }

    const vehicle = await Vehicle.findByPk(sale.vehicleId, {
      transaction
    });

    const configuration = await Configuration.findByPk(
      req.body.configurationId || sale.configurationId,
      {
        transaction
      }
    );

    if (!configuration) {
      await transaction.rollback();

      return res.status(404).json({
        error: 'Комплектацію не знайдено'
      });
    }

    const finalPrice =
      Number(vehicle.price) +
      Number(configuration.basePrice);

    await sale.update({
      clientId: req.body.clientId || sale.clientId,
      vehicleId: req.body.vehicleId || sale.vehicleId,
      configurationId:
        req.body.configurationId || sale.configurationId,
      finalPrice,
      paymentType: req.body.paymentType || sale.paymentType,
      status: req.body.status || sale.status
    }, {
      transaction
    });

    if (sale.status === 'paid') {
      await vehicle.update({
        status: 'sold'
      }, {
        transaction
      });
    } else if (sale.status === 'cancelled') {
      await vehicle.update({
        status: 'available'
      }, {
        transaction
      });
    } else {
      await vehicle.update({
        status: 'reserved'
      }, {
        transaction
      });
    }

    await transaction.commit();

    res.json({
      message: 'Продаж оновлено',
      sale
    });
  } catch (error) {
    await transaction.rollback();

    res.status(400).json({
      error: error.message
    });
  }
});

app.delete('/sales/:id', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const sale = await Sale.findByPk(req.params.id, {
      transaction
    });

    if (!sale) {
      await transaction.rollback();

      return res.status(404).json({
        error: 'Продаж не знайдено'
      });
    }

    await Vehicle.update(
      { status: 'available' },
      {
        where: {
          id: sale.vehicleId
        },
        transaction
      }
    );

    await SaleOption.destroy({
      where: {
        saleId: sale.id
      },
      transaction
    });

    await sale.destroy({
      transaction
    });

    await transaction.commit();

    res.json({
      message: 'Продаж видалено'
    });
  } catch (error) {
    await transaction.rollback();

    res.status(400).json({
      error: error.message
    });
  }
});

// ==================== ЗАПОВНЕННЯ ТЕСТОВИМИ ДАНИМИ ====================

app.post('/seed', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const unique = Date.now();

    const brand = await Brand.create({
      name: `Toyota ${unique}`,
      country: 'Japan'
    }, { transaction });

    const carModel = await CarModel.create({
      name: `Camry ${unique}`,
      releaseYear: 2024,
      brandId: brand.id
    }, { transaction });

    const configuration = await Configuration.create({
      name: `Premium ${unique}`,
      engine: '2.5 бензин',
      transmission: 'Автомат',
      fuelType: 'Бензин',
      basePrice: 35000,
      carModelId: carModel.id
    }, { transaction });

    const option = await Option.create({
      name: `Шкіряний салон ${unique}`,
      price: 1500,
      description: 'Шкіряний салон'
    }, { transaction });

    await configuration.addOption(option, {
      transaction
    });

    const vehicle = await Vehicle.create({
      vin: `VIN${unique}`,
      color: 'Чорний',
      productionYear: 2024,
      price: 36500,
      status: 'available',
      configurationId: configuration.id
    }, { transaction });

    const client = await Client.create({
      firstName: 'Іван',
      lastName: `Петренко ${unique}`,
      phone: `+38099${String(unique).slice(-7)}`,
      email: `client${unique}@example.com`,
      address: 'Київ'
    }, { transaction });

    const sale = await Sale.create({
      clientId: client.id,
      vehicleId: vehicle.id,
      finalPrice: 38000,
      paymentType: 'card',
      status: 'paid'
    }, { transaction });

    await vehicle.update({
      status: 'sold'
    }, { transaction });

    await sale.addOption(option, {
      through: {
        price: option.price
      },
      transaction
    });

    await transaction.commit();

    res.status(201).json({
      message: 'Тестові дані успішно додані',
      ids: {
        brandId: brand.id,
        modelId: carModel.id,
        configurationId: configuration.id,
        vehicleId: vehicle.id,
        clientId: client.id,
        saleId: sale.id
      }
    });
  } catch (error) {
    await transaction.rollback();

    console.error(error);

    res.status(500).json({
      message: 'Помилка під час додавання тестових даних',
      error: error.message || String(error)
    });
  }
});

// ==================== ТЕСТОВІ МАРКИ І МОДЕЛІ ====================

app.post('/seed-catalog', async (req, res) => {
  try {
    const catalog = [
      {
        name: 'Mazda',
        country: 'Japan',
        models: [
          {
            name: 'Mazda 3',
            releaseYear: 2024
          },
          {
            name: 'Mazda 6',
            releaseYear: 2023
          },
          {
            name: 'CX-5',
            releaseYear: 2024
          },
          {
            name: 'CX-60',
            releaseYear: 2024
          }
        ]
      },
      {
        name: 'Toyota',
        country: 'Japan',
        models: [
          {
            name: 'Corolla',
            releaseYear: 2024
          },
          {
            name: 'Camry',
            releaseYear: 2024
          },
          {
            name: 'RAV4',
            releaseYear: 2024
          },
          {
            name: 'Land Cruiser',
            releaseYear: 2023
          }
        ]
      },
      {
        name: 'Honda',
        country: 'Japan',
        models: [
          {
            name: 'Civic',
            releaseYear: 2024
          },
          {
            name: 'Accord',
            releaseYear: 2023
          },
          {
            name: 'CR-V',
            releaseYear: 2024
          },
          {
            name: 'HR-V',
            releaseYear: 2024
          }
        ]
      }
    ];

    const result = [];

    for (const brandData of catalog) {
      const [brand] = await Brand.findOrCreate({
        where: {
          name: brandData.name
        },
        defaults: {
          country: brandData.country
        }
      });

      const models = [];

      for (const modelData of brandData.models) {
        const [carModel] = await CarModel.findOrCreate({
          where: {
            name: modelData.name,
            brandId: brand.id
          },
          defaults: {
            releaseYear: modelData.releaseYear
          }
        });

        models.push(carModel);
      }

      result.push({
        brand,
        models
      });
    }

    res.status(201).json({
      message: 'Тестові марки і моделі успішно додані',
      data: result
    });
  } catch (error) {
    console.error('SEED CATALOG ERROR:', error);

    res.status(500).json({
      error: error.message
    });
  }
});

// ==================== ЗАПУСК ====================

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    await sequelize.sync({
      alter: true
    });

    console.log('Tables synchronized successfully');

    const port = process.env.PORT || 3000;

    app.listen(port, () => {
      console.log(`Server started: http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

start();