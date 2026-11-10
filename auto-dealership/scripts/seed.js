// Заповнення бази демо-даними (запускати один раз після розгортання).
// Використання: npm run seed
// Скрипт ідемпотентний: якщо дані вже є, нічого не додає.

const { sequelize, Brand, CarModel, Configuration, Option, Vehicle, Client, Sale, SaleOption } = require('../src/models');

async function seed() {
  await sequelize.sync();

  const existing = await Brand.count();
  if (existing > 0) {
    console.log('База вже містить дані — seeding пропущено.');
    await sequelize.close();
    return;
  }

  const toyota = await Brand.create({ name: 'Toyota', country: 'Japan' });
  const bmw = await Brand.create({ name: 'BMW', country: 'Germany' });
  const tesla = await Brand.create({ name: 'Tesla', country: 'USA' });

  const camry = await CarModel.create({ name: 'Camry', releaseYear: 2024, brandId: toyota.id });
  const rav4 = await CarModel.create({ name: 'RAV4', releaseYear: 2023, brandId: toyota.id });
  const x5 = await CarModel.create({ name: 'X5', releaseYear: 2024, brandId: bmw.id });
  const modelY = await CarModel.create({ name: 'Model Y', releaseYear: 2024, brandId: tesla.id });

  const camryComfort = await Configuration.create({
    name: 'Comfort', engine: '2.5 бензин', transmission: 'Автомат',
    fuelType: 'Бензин', basePrice: 32000, carModelId: camry.id
  });
  await Configuration.create({
    name: 'Prestige', engine: '3.5 бензин', transmission: 'Автомат',
    fuelType: 'Бензин', basePrice: 45000, carModelId: camry.id
  });
  const rav4Hybrid = await Configuration.create({
    name: 'Hybrid', engine: '2.5 гібрид', transmission: 'Автомат',
    fuelType: 'Гібрид', basePrice: 39000, carModelId: rav4.id
  });
  const x5M = await Configuration.create({
    name: 'M Sport', engine: '3.0 дизель', transmission: 'Автомат',
    fuelType: 'Дизель', basePrice: 78000, carModelId: x5.id
  });
  const modelYLong = await Configuration.create({
    name: 'Long Range', engine: 'електро', transmission: 'Автомат',
    fuelType: 'Електро', basePrice: 52000, carModelId: modelY.id
  });

  const leather = await Option.create({ name: 'Шкіряний салон', price: 1500 });
  const panorama = await Option.create({ name: 'Панорамний дах', price: 2000 });
  await Option.create({ name: 'Підігрів сидінь', price: 500 });

  await camryComfort.addOption(leather);
  await rav4Hybrid.addOption(panorama);

  await Vehicle.create({
    vin: 'JT2BF22K1W0123456', color: 'Білий', productionYear: 2024,
    price: 33000, status: 'available', configurationId: camryComfort.id
  });
  await Vehicle.create({
    vin: 'WBAJA9C5XJK123457', color: 'Чорний', productionYear: 2024,
    price: 80000, status: 'available', configurationId: x5M.id
  });
  const soldVehicle = await Vehicle.create({
    vin: '5YJ3E1EBXJF123458', color: 'Синій', productionYear: 2024,
    price: 54000, status: 'sold', configurationId: modelYLong.id
  });

  const client = await Client.create({
    firstName: 'Остап', lastName: 'Прокоса', phone: '+380671234567',
    email: 'client@example.com', address: 'м. Львів'
  });

  const sale = await Sale.create({
    saleDate: new Date('2026-10-15'), finalPrice: 56500,
    paymentType: 'card', status: 'paid',
    configurationId: modelYLong.id, clientId: client.id, vehicleId: soldVehicle.id
  });
  await SaleOption.create({ saleId: sale.id, optionId: panorama.id, price: 2000 });

  console.log('Демо-дані додано успішно.');
  await sequelize.close();
}

seed().catch(err => {
  console.error('Помилка seeding:', err.message);
  process.exit(1);
});
