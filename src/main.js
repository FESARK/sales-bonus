/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const discount = 1 - (purchase.discount / 100);
   const revenue = purchase.sale_price * purchase.quantity * discount;
   return revenue;
}



/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
   if (!data) {
    throw new Error('Некорректные входные данные');
   }

    const requiredArrays = [
        'purchase_records',
        'products',
        'sellers'
    ];

    for (const arrayName of requiredArrays) {
        if (!data[arrayName]) {
            throw new Error(`отсутствует массив ${arrayName}`);
        }

        if (!Array.isArray(data[arrayName])) {
            throw new Error(`${arrayName} должен быть массивом`);
        }

        if (data[arrayName].length === 0) {
            throw new Error( `Массив ${arrayName} пустой`);
        }
    }

     // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options; 
    
    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Отсутствуют обязательные опции');
    }

    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Обязательные опции должны быть функциями');
        
    }
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = sellerStats.reduce((acc, seller) => {
        acc[seller.id] = seller;
        return acc;
    }, {});

    const productIndex = data.products.reduce((acc, product) => {
        acc[product.sku] = product;
        return acc;
    }, {});

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count += 1;
        seller.revenue += record.total_amount; 

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item);
            const profit = revenue - cost;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        })
    })
    // @TODO: Сортировка продавцов по прибыли
    const sortedSellers = sellerStats.toSorted((a, b) => b.profit - a.profit);
    
    // @TODO: Назначение премий на основе ранжирования
    sortedSellers.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sortedSellers.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({sku, quantity}))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });
    
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sortedSellers.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }))
}
