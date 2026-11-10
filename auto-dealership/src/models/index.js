const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Підключення до PostgreSQL.
// Пріоритет: DATABASE_URL (наприклад, Railway/хмарні хостинги),
// далі окремі змінні DB_NAME / DB_USER / DB_PASSWORD / DB_HOST / DB_PORT (.env).
function createSequelize() {
  if (process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: process.env.DB_SSL === 'true'
        ? { ssl: { rejectUnauthorized: false } }
        : {}
    });
  }

  return new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: false
    }
  );
}

const sequelize = createSequelize();

// ==================== МАРКА ====================

const Brand = sequelize.define('Brand', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  country: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// ==================== МОДЕЛЬ АВТО ====================

const CarModel = sequelize.define('CarModel', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  releaseYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

// ==================== КОМПЛЕКТАЦІЯ ====================

const Configuration = sequelize.define('Configuration', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  engine: {
    type: DataTypes.STRING,
    allowNull: true
  },

  transmission: {
    type: DataTypes.STRING,
    allowNull: true
  },

  fuelType: {
    type: DataTypes.STRING,
    allowNull: true
  },

  basePrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  }
});

// ==================== ДОДАТКОВА ОПЦІЯ ====================

const Option = sequelize.define('Option', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// ==================== АВТОМОБІЛЬ ====================

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  vin: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },

  color: {
    type: DataTypes.STRING,
    allowNull: false
  },

  productionYear: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM(
      'available',
      'reserved',
      'sold'
    ),
    allowNull: false,
    defaultValue: 'available'
  }
});

// ==================== КЛІЄНТ ====================

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },

  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },

  address: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// ==================== ПРОДАЖ ====================

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  saleDate: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },

  finalPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },

  paymentType: {
    type: DataTypes.ENUM(
      'cash',
      'card',
      'credit',
      'leasing'
    ),
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM(
      'created',
      'paid',
      'cancelled'
    ),
    allowNull: false,
    defaultValue: 'created'
  },

  configurationId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// ==================== ОПЦІЇ ПРОДАЖУ ====================

const SaleOption = sequelize.define('SaleOption', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  }
});

// ==================== ЗВ’ЯЗКИ ====================

// Brand 1 — багато моделей
Brand.hasMany(CarModel, {
  foreignKey: 'brandId',
  onDelete: 'CASCADE'
});

CarModel.belongsTo(Brand, {
  foreignKey: 'brandId'
});

// Модель 1 — багато комплектацій
CarModel.hasMany(Configuration, {
  foreignKey: 'carModelId',
  onDelete: 'CASCADE'
});

Configuration.belongsTo(CarModel, {
  foreignKey: 'carModelId'
});

// Комплектація 1 — багато автомобілів
Configuration.hasMany(Vehicle, {
  foreignKey: 'configurationId',
  onDelete: 'CASCADE'
});

Vehicle.belongsTo(Configuration, {
  foreignKey: 'configurationId'
});

// Комплектація багато — багато опцій
Configuration.belongsToMany(Option, {
  through: 'ConfigurationOptions',
  foreignKey: 'configurationId',
  otherKey: 'optionId'
});

Option.belongsToMany(Configuration, {
  through: 'ConfigurationOptions',
  foreignKey: 'optionId',
  otherKey: 'configurationId'
});

// Клієнт 1 — багато продажів
Client.hasMany(Sale, {
  foreignKey: 'clientId',
  onDelete: 'RESTRICT'
});

Sale.belongsTo(Client, {
  foreignKey: 'clientId'
});

// Автомобіль 1 — продаж
Vehicle.hasOne(Sale, {
  foreignKey: 'vehicleId'
});

Sale.belongsTo(Vehicle, {
  foreignKey: 'vehicleId'
});

// ВАЖЛИВИЙ ЗВ’ЯЗОК
// Комплектація 1 — багато продажів
Configuration.hasMany(Sale, {
  foreignKey: 'configurationId'
});

Sale.belongsTo(Configuration, {
  foreignKey: 'configurationId'
});

// Продаж багато — багато опцій
Sale.belongsToMany(Option, {
  through: SaleOption,
  foreignKey: 'saleId',
  otherKey: 'optionId'
});

Option.belongsToMany(Sale, {
  through: SaleOption,
  foreignKey: 'optionId',
  otherKey: 'saleId'
});

// ==================== ЕКСПОРТ ====================

module.exports = {
  sequelize,
  Brand,
  CarModel,
  Configuration,
  Option,
  Vehicle,
  Client,
  Sale,
  SaleOption
};