let items = document.querySelectorAll(`[data-section-type="collection"] .product-item__title`);
let array = [];
for (let item of items) { array.push(item.href) };
console.log(array);