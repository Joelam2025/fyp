const siteLink = require('./link');
const mysql = require('mysql');
const util = require("util");
const crypto = require("crypto");
const stripe = require('stripe')('sk_test_51Qo2BgRvAcFq2AQeYhKDfJx2GLPzsO2xojsi55laFwrthN5mVjppEmh6lSTaYeqdygRjmvnJgRsDTEwnSkec0IIl00tGM3BEQ3');

// Create connection
const connection = mysql.createConnection({
    host: 'localhost',     // Your database host
    user: 'root',          // Your database user
    password: '',  // Your database password
    database: 'website' // Your database name
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL');
});

function insertProduct(callback, product_id, product_name, product_price, product_url, imageUrl, product_description, product_detail, categories_id, stock_level) {
	const insertQuery = `INSERT INTO product (product_id, product_name, product_price, product_url, product_display_image_url, product_description, product_detail, categories_id, stock_level) VALUES ('${product_id}', '${product_name}', '${product_price}', '${product_url}', '${imageUrl}', '${product_description}', '${product_detail}', '${categories_id}', '${stock_level}')`;

	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function insertCategories(callback, categorieName, parentCategorie, categorieDescription) {
	const insertQuery = `INSERT INTO categories (categories_name, parent_categories_id, categories_description) VALUES ('${categorieName}', '${parentCategorie}', '${categorieDescription}')`;
	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function insertCartItem(callback, productId, userId, quantity) {
	const selectQuery = `SELECT cart_id FROM shopping_cart WHERE user_id = '${userId}'`;
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		
		const cartId = result[0].cart_id;
		const selectCartItemQuery = `SELECT product_id, quantity FROM cart_item WHERE cart_id = '${cartId}' and product_id = '${productId}'`;
		
		connection.query(selectCartItemQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			if (result.length > 0) {
				
				const updateQuery = `UPDATE cart_item SET quantity = ${parseFloat(result[0].quantity) + parseFloat(quantity)} WHERE cart_id = '${cartId}' and product_id = '${productId}'`;
				connection.query(updateQuery, (err, result) => {
					if (err) {
						callback(err, null);
					}
					callback(null, "Add to cart successfully");
				});
			}
			else {
				const insertQuery = `INSERT INTO cart_item (cart_id, product_id, quantity) VALUES ('${cartId}', '${productId}', '${quantity}')`;
				connection.query(insertQuery, (err, result) => {
					if (err) {
						callback(err, null);
					}
					callback(null, "Add to cart successfully");
				});
			}
		});
	});
}

function insertAdminRole(callback, name, description) {
	const insertQuery = `INSERT INTO admin_role (role_name, description) VALUES ('${name}', '${description}')`;
	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function insertAdmin(callback, name, email, adminPassword, roleId, isActive) {
	const insertQuery = `INSERT INTO admin (role_id, user_name, email, password, status) VALUES ('${roleId}', '${name}', '${email}', '${adminPassword}', '${isActive}')`;
	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function insertReview(callback, productId, userId, userIconUrl, userName, user_icon_url, reviewMessage, isActive) {
	const insertQuery = `INSERT INTO review (product_id, user_id, user_icon_url, author, content, status) VALUES ('${productId}', '${userId}', '${user_icon_url}', '${userName}', '${reviewMessage}', '${isActive}')`;

	let resultContent;

	connection.query(insertQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function createDelivery(callback, userId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode, isPrimary) {
	let isPrimary2 = (isPrimary == "true") ? 1 : 0;

	let insertQuery = `INSERT INTO users_delivery (user_id, first_name, last_name, contact_phone, contact_email, address1, address2, region, city_area, city, city_code, is_primary) VALUES ('${userId}', '${firstName}', '${lastName}', ${contactPhone}, '${contactEmail}', '${address1}', '${address2}', '${region}', '${cityArea}', '${city}', '${cityCode}', ${isPrimary2})`;
	const selectQuery = `SELECT * from users_delivery where user_id = "${userId}"`;
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		if (result.length < 1) {
			insertQuery = `INSERT INTO users_delivery (user_id, first_name, last_name, contact_phone, contact_email, address1, address2, region, city_area, city, city_code, is_primary) VALUES ('${userId}', '${firstName}', '${lastName}', ${contactPhone}, '${contactEmail}', '${address1}', '${address2}', '${region}', '${cityArea}', '${city}', '${cityCode}', 1)`;
		}
		result.forEach((row) => {
			if (row.is_primary == 1 && isPrimary2 == 1) {
				connection.query(`UPDATE users_delivery set is_primary = 0 WHERE delivery_id = ${row.delivery_id}`, (err, result) => {
					if (err) {
						//callback(err, null);
					}
				});
			}
		});
		connection.query(insertQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, "insert delivery successfully");
		});
	});
}

function getDelivery(callback, userId, isPrimary) {
	let isPrimary2 = (isPrimary == "true") ? 1 : 0;

	const selectQuery = `SELECT * from users_delivery where user_id = "${userId}"`;
	
	let resultRow = "";
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			return;
			callback(err, null);
		}
		result.forEach((row) => {
			let checkBox = "";
			let temp = "";
			if (row.is_primary == 0) {
				checkBox = `<div class="custom-control custom-checkbox">
								<input type="checkbox" class="custom-control-input" id="isPrimaryDeliveryGroup${row.delivery_id}">
								<label class="custom-control-label" for="isPrimaryDeliveryGroup${row.delivery_id}"  data-toggle="collapse">Is Primary</label>
								<br>
							</div>`;
			}
			else {
				checkBox = `<div class="custom-control custom-checkbox">
					<input type="checkbox" checked class="custom-control-input" id="isPrimaryDeliveryGroup${row.delivery_id}">
					<label class="custom-control-label" for="isPrimaryDeliveryGroup${row.delivery_id}"  data-toggle="collapse">Is Primary</label>
					<br>
				</div>`;
			}
			
			temp = `
				<div style="display: flex; align-items: center;" data-toggle="collapse" data-target="#deliveryAddressDeliveryGroup${row.delivery_id}">
					<h4 class="font-weight-semi-bold mb-4">NAME: ${row.last_name} ${row.first_name}</h4>
					<label style="margin-left: auto;">${row.is_primary == 1? "PRIMARY + ": "+"}</label>
				</div>
				<div class="collapse mb-4" id="deliveryAddressDeliveryGroup${row.delivery_id}">
					<div class="row">
						<div class="col-md-6 form-group">
							<label>First Name</label>
							<input id="firstNameDeliveryGroup${row.delivery_id}" class="form-control" type="text" value="${row.first_name}">
						</div>
						<div class="col-md-6 form-group">
							<label>Last Name</label>
							<input id="lastNameDeliveryGroup${row.delivery_id}" class="form-control" type="text" value="${row.last_name}">
						</div>
						<div class="col-md-6 form-group">
							<label>E-mail</label>
							<input id="contactEmailDeliveryGroup${row.delivery_id}" class="form-control" type="email" placeholder="example@email.com" value="${row.contact_email}">
						</div>
						<div class="col-md-6 form-group">
							<label>Mobile No</label>
							<input id="contactPhoneDeliveryGroup${row.delivery_id}" class="form-control" type="text" placeholder="+852 1234 5678" value="${row.contact_phone}">
						</div>
						<div class="col-md-6 form-group">
							<label>Address Line 1</label>
							<input id="address1DeliveryGroup${row.delivery_id}" class="form-control" type="text" placeholder="123 Street" value="${row.address1}">
						</div>
						<div class="col-md-6 form-group">
							<label>Address Line 2</label>
							<input id="address2DeliveryGroup${row.delivery_id}" class="form-control" type="text" placeholder="123 Street" value="${row.address2}">
						</div>
						<div class="col-md-6 form-group">
							<label>Country</label>
							<select class="custom-select" id="regionDeliveryGroup${row.delivery_id}" disabled>
								<option selected>China</option>
							</select>
						</div>
						<div class="col-md-6 form-group">
							<label>City</label>
							<input id="cityDeliveryGroup${row.delivery_id}" class="form-control" type="text" value="Hong Kong" placeholder="Hong Kong" disabled>
						</div>
						<div class="col-md-6 form-group">
							<label>Area</label>
							<select class="custom-select" id="cityAreaDeliveryGroup${row.delivery_id}">
								${row.city_area == 'New Territories' ? '<option selected>New Territories</option><option>Kowloon</option><option>Hong Kong Island</option>': 
								row.city_area == 'Kowloon' ? '<option>New Territories</option><option selected>Kowloon</option><option>Hong Kong Island</option>': 
								'<option>Hong Kong Island</option><option>Kowloon</option><option selected>Hong Kong Island</option>'}
							</select>
						</div>
						<div class="col-md-6 form-group" hidden>
							<label>ZIP Code</label>
							<input id="cityCodeDeliveryGroup${row.delivery_id}" class="form-control" type="text" placeholder="123">
						</div>
						<div class="col-md-6 form-group">
						</div>
						<div class="col-md-6 form-group">` + 
							checkBox + 
						`</div>
						<div class="col-md-12 form-group">
							<div class="card-footer border-secondary bg-transparent">
								<button class="btn btn-lg btn-block btn-primary font-weight-bold my-3 py-3" onclick="updateAddress('${row.delivery_id}')">Save Delivery</button>
							</div>
						</div>
					</div>
				</div><hr>`;
			
			if (row.is_primary == 0) {
				resultRow += temp;
			}
			else {
				resultRow = temp + resultRow;
			}
		});
		callback(null, resultRow);
	});
}

function getPageProduct(callback, page, minPrice, maxPrice, method, productName, productCategory) {
	const maxNum = (page - 1) * 20 + 20;
	const minNum = (page - 1) * 20;
	//let selectQuery = `select count(*) as product_Count from product INNER JOIN discount ON product.product_id = discount.product_id order by product.create_at desc limit ${maxNum} offset ${minNum};`;
	//let selectQuery2 = `select product.*, discount.* from product INNER JOIN discount ON product.product_id = discount.product_id order by product.create_at desc limit ${maxNum} offset ${minNum};`;
	let selectQuery = `select count(*) as product_Count from product order by create_at desc limit ${maxNum} offset ${minNum};`;
	let selectQuery2 = `select * from product order by create_at desc limit ${maxNum} offset ${minNum};`;
	let productNum;
	let resultRow = "";
	let productCount;
if (productCategory != null && productCategory != "null") {
	selectQuery = `select count(*) as product_Count from product where categories_id = ${productCategory} order by create_at desc limit ${maxNum} offset ${minNum};`;
	selectQuery2 = `select * from product where categories_id = ${productCategory} order by create_at desc limit ${maxNum} offset ${minNum};`;
}

	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		if (result.length > 0)
			productCount = result[0].product_Count;
		else 
			productCount = 0;
	});
	connection.query(selectQuery2, (err, result) => {
		if (err) {
			callback(err, null);
		}
		
		result.forEach((row) => {
			let pageContent = `<div class="col-lg-4 col-md-6 col-sm-12 pb-1">
				<div class="card product-item border-0 mb-4">
					<div class="card-header product-img position-relative overflow-hidden bg-transparent border p-0">
						<a href="${row.product_url}" target="_blank"><img class="img-fluid w-100" src="${row.product_display_image_url}" alt=""></a>
					</div>
					<div class="card-body border-left border-right text-center p-0 pt-4 pb-3">
						<h6 class="text-truncate mb-3">${row.product_name}</h6>
						<div class="d-flex justify-content-center">
							<h6>$123.00</h6><h6 class="text-muted ml-2"><del>$123.00</del></h6>
						</div>
					</div>
					<div class="card-footer d-flex justify-content-between bg-light border">
						<a href="${row.product_url}" target="_blank" class="btn btn-sm text-dark p-0"><i class="fas fa-eye text-primary mr-1"></i></a>
						<a onclick="addToCart('${row.product_id}')" class="btn btn-sm text-dark p-0"><i class="fas fa-shopping-cart text-primary mr-1"></i></a>
					</div>
				</div>
			</div>`;
			productNum = row.total_record;
			resultRow += pageContent;
		});
			
			const pageLinkContent = `<div class="col-12 pb-1">
				<nav aria-label="Page navigation">
				  <ul class="pagination justify-content-center mb-3">
				  ${(parseFloat(page) - 1 !== 0)
					? `<li class="page-item">`
					: `<li class="page-item disabled">`
				   }
					  <a class="page-link" onclick="paging(${parseFloat(page) - 1})" aria-label="Previous">
						<span aria-hidden="true"><</span>
						<span class="sr-only">Previous</span>
					  </a>
					</li>
					${(parseFloat(page) - 1 !== 0)
						? `<li class="page-item"><a class="page-link" onclick="paging(${parseFloat(page) - 1})">${parseFloat(page) - 1}</a></li>`
						: ''
					}

					<li class="page-item active"><a class="page-link" onclick="paging(${parseFloat(page)})">${parseFloat(page)}</a></li>
					${(page * 20 < productCount)
						? `<li class="page-item"><a class="page-link" onclick="paging(${parseFloat(page) + 1}) + ''">${parseFloat(page) + 1}</a></li>
						<li class="page-item">	
						  <a class="page-link" onclick="paging(${parseFloat(page) + 1})" aria-label="Next">
							<span aria-hidden="true">></span>
							<span class="sr-only">Next</span>
						  </a>
						</li>`
						: ''
					}
				  </ul>
				</nav>
			</div>`;
		resultRow += pageLinkContent;
		callback(null, resultRow);
	});
}

function getAdminRole(callback) {
	let selectQuery = `select role_id, role_name, description from admin_role`;

	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.role_id}">id:${row.role_id} Name: ${row.role_name} - Description: ${row.description}</option>`;
		});
		callback(null, resultRow);
	});
}

function getOrderDelivery(callback, userId) {
	let selectQuery = `SELECT * from users_delivery where user_id = "${userId}" and is_primary=1`;

	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow = `
					<div class="row" id="deliveryAddressDeliveryGroup${row.delivery_id}">
						<div class="col-md-6 form-group">
							<label>First Name</label>
							<input id="firstNameDeliveryGroup${row.delivery_id}" class="form-control" type="text" disabled value="${row.first_name}">
						</div>
						<div class="col-md-6 form-group">
							<label>Last Name</label>
							<input id="lastNameDeliveryGroup${row.delivery_id}" class="form-control" type="text" disabled value="${row.last_name}">
						</div>
						<div class="col-md-6 form-group">
							<label>E-mail</label>
							<input id="contactEmailDeliveryGroup${row.delivery_id}" class="form-control" type="email" disabled placeholder="example@email.com" value="${row.contact_email}">
						</div>
						<div class="col-md-6 form-group">
							<label>Mobile No</label>
							<input id="contactPhoneDeliveryGroup${row.delivery_id}" class="form-control" type="text" disabled placeholder="+852 1234 5678" value="${row.contact_phone}">
						</div>
						<div class="col-md-6 form-group">
							<label>Address Line 1</label>
							<input id="address1DeliveryGroup${row.delivery_id}" class="form-control" type="text" disabled placeholder="123 Street" value="${row.address1}">
						</div>
						<div class="col-md-6 form-group">
							<label>Address Line 2</label>
							<input id="address2DeliveryGroup${row.delivery_id}" class="form-control" type="text" disabled placeholder="123 Street" value="${row.address2}">
						</div>
						<div class="col-md-6 form-group">
							<label>Country</label>
							<select class="custom-select" id="regionDeliveryGroup${row.delivery_id}" disabled>
								<option selected>China</option>
							</select>
						</div>
						<div class="col-md-6 form-group">
							<label>City</label>
							<input id="cityDeliveryGroup${row.delivery_id}" class="form-control" type="text" value="Hong Kong" placeholder="Hong Kong" disabled>
						</div>
						<div class="col-md-6 form-group">
							<label>Area</label>
							<select disabled class="custom-select" id="cityAreaDeliveryGroup${row.delivery_id}">
								${row.city_area == 'New Territories' ? '<option selected>New Territories</option><option>Kowloon</option><option>Hong Kong Island</option>': 
								row.city_area == 'Kowloon' ? '<option>New Territories</option><option selected>Kowloon</option><option>Hong Kong Island</option>': 
								'<option>Hong Kong Island</option><option>Kowloon</option><option selected>Hong Kong Island</option>'}
							</select>
						</div>
						<div class="col-md-6 form-group" hidden>
							<label>ZIP Code</label>
							<input id="cityCodeDeliveryGroup${row.delivery_id}" class="form-control" type="text" placeholder="123">
						</div>
						<div class="col-md-6 form-group">
						</div>
					</div>`;
		});
		callback(null, resultRow);
	});
}

function modifyCartItem(callback, productGridId, quantity) {
	let selectQuery = "";
	
	if (quantity == '0')
		selectQuery = `delete from cart_item where cart_item_id = '${productGridId.replace("productGrid", "")}'`;
	else
		selectQuery = `Update cart_item set quantity="${quantity}" where cart_item_id = '${productGridId.replace("productGrid", "")}'`;
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, "update cart item successfully");
	});
}

async function orderCartItem(callback, userId) {
    const selectQuery = `
        SELECT cart_item.cart_item_id, cart_item.quantity, product.product_id, product.product_name, product.product_price
        FROM shopping_cart 
        JOIN cart_item ON shopping_cart.cart_id = cart_item.cart_id 
        JOIN product ON product.product_id = cart_item.product_id
        WHERE shopping_cart.user_id = '${userId}';
    `;
	
    try {
        const queryAsync = util.promisify(connection.query).bind(connection);
        const result = await queryAsync(selectQuery);

        if (!result.length) {
            return callback(null, "No items found in the cart.");
        }

        let totalAmount = result.reduce((sum, item) => sum + (parseFloat(item.product_price) * parseInt(item.quantity)), 0);

        const orderId = crypto.randomBytes(16).toString("hex"); // Reduced size for readability
        const insertOrderQuery = `INSERT INTO orders(order_id, user_id, total_amount, status) VALUES ('${orderId}', '${userId}', ${totalAmount}, 'pending')`;
        await queryAsync(insertOrderQuery);

        // Insert all order items in parallel
		const orderItemsQueries = result.map(item => {
            return queryAsync(`INSERT INTO order_items(order_id, product_id, quantity, status) VALUES ('${orderId}', '${item.product_id}', ${item.quantity}, 'pending')`);
        });

        await Promise.all(orderItemsQueries);

		const deleteQuery = `DELETE FROM cart_item WHERE cart_id IN (SELECT cart_id FROM shopping_cart WHERE user_id = '${userId}')`;
		connection.query(deleteQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
		});

        const lineItems = result.map(item => ({
            price_data: {
                currency: "hkd",
                product_data: { name: item.product_name },
                unit_amount: parseFloat(item.product_price) * 100,
            },
            quantity: parseInt(item.quantity),
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: siteLink + "orderSuccess.html?order=" + orderId,
            cancel_url: siteLink + "cancel",
        });

        // Send response **only once**, after all queries complete
        callback(null, session.url);
    } catch (error) {
        callback(error, null);
    }
}



function updateDelivery(callback, userId, deliveryId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode2, isPrimary) {
	const isPrimary2 = (isPrimary == "true") ? 1 : 0;
	
	let updateQuery = `Update users_delivery set first_name="${firstName}", last_name="${lastName}", contact_phone=${contactPhone}, contact_email='${contactEmail}', address1='${address1}', address2='${address2}', region='${region}', city_area='${cityArea}', city='${city}', city_code=${cityCode2}, is_primary=${isPrimary2} where delivery_id = ${deliveryId}`;
	
	const selectQuery = `SELECT * from users_delivery where user_id = "${userId}"`;
	let temp = false;
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		for (let i = 0; i < result.length; i++) {
			if (isPrimary2 == 1) {
				if (result[i].is_primary == 1) {
					connection.query(`UPDATE users_delivery set is_primary = 0 WHERE delivery_id = ${result[i].delivery_id}`, (err, result) => {
						if (err) {
							//callback(err, null);
						}
					});
				}
			}
			else {
				if (result[i].is_primary == 1) {
					temp = true;
				}
			}
		}
		
		if (temp == false) {
			updateQuery = `Update users_delivery set first_name="${firstName}", last_name="${lastName}", contact_phone=${contactPhone}, contact_email='${contactEmail}', address1='${address1}', address2='${address2}', region='${region}', city_area='${cityArea}', city='${city}', city_code=${cityCode2}, is_primary=1 where delivery_id = ${deliveryId}`;
		}
		
		connection.query(updateQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			callback(null, "update delivery successfully");
		});
	});
}

async function getCartItem(userId, isOrder) {
    const query = util.promisify(connection.query).bind(connection); // Promisify 'query' for easier async handling
    const selectQuery = `SELECT cart_id FROM shopping_cart WHERE user_id = '${userId}'`;
	
    let resultRow = "";
	let lastRow;
	let subTotalPrice = 0;;
	let shippingPrice = 30;
	
    try {
        const cartIds = await query(selectQuery); // Wait for cart IDs query to finish
        for (const row of cartIds) {
            const selectCartQuery = `SELECT cart_item_id, quantity, product_id FROM cart_item WHERE cart_id = '${row.cart_id}'`;
            const cartItems = await query(selectCartQuery); // Wait for cart items query to finish

            for (const row3 of cartItems) {
                const selectProductQuery = `SELECT product_name, product_price, product_display_image_url FROM product WHERE product_id = '${row3.product_id}'`;
                const products = await query(selectProductQuery); // Wait for product details queryaf to finish
                products.forEach((row2) => {
					subTotalPrice += parseFloat(row2.product_price * parseFloat(row3.quantity));
					if (isOrder == "false") {
						resultRow += `<tr id="productGrid${row3.cart_item_id}">
							<td class="align-middle"><img src="${row2.product_display_image_url}" alt="" style="width: 50px;"> ${row2.product_name}</td>
							<td class="align-middle" name="productPrice">$${row2.product_price}</td>
							<td class="align-middle">
								<div class="input-group quantity mx-auto" style="width: 100px;">
									<div class="input-group-btn">
										<button onclick="changeItemStatus(-1, 'productGrid${row3.cart_item_id}', false)" class="btn btn-sm btn-primary btn-minus">
										<i class="fa fa-minus"></i>
										</button>
									</div>
									<input type="text" id="quantityproductGrid${row3.cart_item_id}" onchange="changeItemStatus(this.value, 'productGrid${row3.cart_item_id}', true)" class="form-control form-control-sm bg-secondary text-center" value="${row3.quantity}">
									<div class="input-group-btn">
										<button onclick="changeItemStatus(1, 'productGrid${row3.cart_item_id}', false)" class="btn btn-sm btn-primary btn-plus">
											<i class="fa fa-plus"></i>
										</button>
									</div>
								</div>
							</td>
							<td class="align-middle" name="productTotalPrice">$${parseFloat(row2.product_price) * parseFloat(row3.quantity)}</td>
							<td class="align-middle"><button onclick="changeItemStatus(0, 'productGrid${row3.cart_item_id}', true)" class="btn btn-sm btn-primary"><i class="fa fa-times"></i></button></td>
						</tr>`;
					}
					else {
						resultRow += `<div class="d-flex justify-content-between">
									<p>${row2.product_name}</p>
									<p>$${row2.product_price} * ${row3.quantity}</p>
								</div>`;
								
						lastRow = `<div class="d-flex justify-content-between mb-3 pt-1">
									<h6 class="font-weight-medium">Subtotal</h6>
									<h6 class="font-weight-medium">$${subTotalPrice}</h6>
								</div>
								<div class="d-flex justify-content-between">
									<h6 class="font-weight-medium">Shipping</h6>
									<h6 class="font-weight-medium">$${shippingPrice}</h6>
								</div>`;
					}
                });
            }
        }

		if (isOrder == "false") {
			
		}
		else {
			resultRow = `<h5 class="font-weight-medium mb-3">Products</h5>` + resultRow + lastRow + ":" + (subTotalPrice + shippingPrice);
		}
        return resultRow; // Return the fully populated resultRow
    } catch (err) {
        throw err; // Pass the error back to the calling function
    }
}

function getReview(callback, productId) {
	let selectQuery = `select * from review where product_id = '${productId}'`;

	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {			
			let reviewContent = row.content;
			let textBefore;
			let textAfter;
			for (let i = 0; i < reviewContent.length; i++) {
				if (i % 30 == 0) {
					textBefore = reviewContent.substring(0, i);
					textAfter = reviewContent.substring(i);
					reviewContent = textBefore + "\n" + textAfter;
				}
			}
			
			resultRow = `<div class="media mb-4">
				<img src="${row.user_icon_url}" alt="Image" class="img-fluid mr-3 mt-1" style="width: 45px;">
				<div class="media-body">
					<h6>${row.author}<small> - <i>${row.update_at}</i></small></h6>
					<div class="text-primary mb-2">
						<i class="fas fa-star"></i>
						<i class="fas fa-star"></i>
						<i class="fas fa-star"></i>
						<i class="fas fa-star-half-alt"></i>
						<i class="far fa-star"></i>
					</div>
					<p id="${row.review_id}">${reviewContent}</p>
				</div>
			</div>` + resultRow;
		});
		callback(null, resultRow);
	});
}

function getAdmin(callback) {
	let selectQuery = `select * from admin`;

	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.admin_id}">id:${row.admin_id}. Name: ${row.user_name}</option>`;
		});
		callback(null, resultRow);
	});
}

function deleteAdmin(callback, adminId) {
	let deleteQuery = `Delete from admin where admin_id = ${adminId}`;

	connection.query(deleteQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function deleteRole(callback, roleId) {
	let deleteQuery = `Delete from admin_role where role_id = ${roleId}`;

	connection.query(deleteQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function updateCategories(callback, action, categorieId, categorieName, parentCategorie, categorieDescription) {
	let updateQuery = "";
	
	if (action == "update")
		updateQuery = `UPDATE categories set categories_name='${categorieName}', parent_categories_id='${parentCategorie}', categories_description='${categorieDescription}' where categories_id=${categorieId}`;
	else if (action == "delete")
		updateQuery = `DELETE FROM categories WHERE categories_id="${categorieId}"`;

	connection.query(updateQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function getSecureityQuestion(callback) {
	let selectQuery = "SELECT question_id, question_content FROM security_questions";
	let resultRow = "";
	connection.query(selectQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		result.forEach((row) => {
			resultRow += `<option id="${row.question_id}">${row.question_content}</option>`;
		});
		callback(null, resultRow);
	});
}

function updateOrderStatusWhenSuccess(callback, order, action) {
	const updateQuery = `UPDATE orders SET status = 'paid' WHERE order_id = '${order}' AND status = 'pending'`;
	const updateQuery2 = `UPDATE order_items SET status = 'paid' WHERE order_id = '${order}' AND status = 'pending'`;

	let resultRow = "";
	connection.query(updateQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		connection.query(updateQuery2, (err, result) => {
				if (err) {
					callback(err, null);
				}
				callback(null, 'update successfully');
			});
	});
}

function getOrder(callback, userId) {
	const selectQuery = `
			SELECT orders.order_id, order_items.quantity, order_items.order_item_id, order_items.status, product.*
			FROM orders 
			JOIN order_items ON order_items.order_id = orders.order_id
			JOIN product ON product.product_id = order_items.product_id
			WHERE orders.user_id = '${userId}';
		`;
	const deleteQuery = `DELETE FROM orders WHERE order_id NOT IN (SELECT order_id FROM order_items);`;
	
	connection.query(deleteQuery, (err, result) => {
		if (err) {
			callback(err, null);
		}
		
		let resultRow = "";
		let temp = "";
			
		connection.query(selectQuery, (err, result) => {
			if (err) {
				callback(err, null);
			}
			let orderNum = 0;
			let orderid = 1;
			result.forEach((row) => {
				if (orderid != row.order_id) {
					orderNum++;
					orderid = row.order_id;
				}

				temp += `<tr>
							<th>${orderNum}</th>
							<th><a href="${row.product_url}">${row.product_name}</a></th>
							<th>$${row.product_price}</th>
							<th>${row.quantity}</th>
							<th>$${parseInt(row.quantity) * parseFloat(row.product_price)}</th>
							<th style="color:red">${row.status}</th>
							<th>
								${(row.status == "pending") ? `<label onclick="pay('${row.order_id}')">Pay</label><br>` : ""}
								<label onclick="removeItem('${row.order_item_id}')">Remove</label>
								<br><a href="orderSuccess.html?order=${row.order_id}" target="_blank">Detail</a>
								</th>
						</tr>`;
				
				
			});
			
			if (temp != 0) {
				resultRow = `<table class="table table-bordered text-center mb-0">
						<thead class="bg-secondary text-dark">
							<tr>
								<th>Order No.</th>
								<th>Products</th>
								<th>Price</th>
								<th>Quantity</th>
								<th>Total</th>
								<th>Status</th>
								<th>Remove</th>
							</tr>
						</thead>
						<tbody class="align-middle" id="cartItemTable">` + temp + `</tbody>
					</table>`;
			}
			else {
				resultRow = `<h3><center>No order? <label onclick="window.location.href = 'shop.html'" style="color: red">Search</label> the things you need</center></h3>`;
			}
			callback(null, resultRow);
		});
	});
}

function getOrderStatusWhenSuccessfully(callback, order) {
	
	let selectQuery = `select orders.*, order_items.quantity, product.* from orders 
	JOIN order_items ON order_items.order_id = orders.order_id 
	JOIN product ON product.product_id = order_items.product_id 
	where orders.order_id = '${order}'`;

	let resultRow = "";
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			console.error('Error updating data:' + err.message);
		}	
		result.forEach((row) => {
			orderId = row.order_id;
			resultRow += `
				<a href="${row.product_url}">${row.product_name}</a> * ${row.quantity}<br>
			`;
		});
		
		resultRow = `<div class="container my-5">
					<div class="row justify-content-center">
						<div class="col-md-8">
							<table class="table table-bordered table-hover text-center" id="orderListTable">
								<thead class="bg-primary text-white">
									<tr>
										<th colspan="2">Order ID: ${result[0].order_id}</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Item</td>
										<td>${resultRow}</td>
									</tr>
									<tr>
										<td>Total Amount</td>
										<td>$${result[0].total_amount}</td>
									</tr>
									<tr>
										<td>Status</td>
										<td><label style="color:red">${result[0].status}</label></td>
									</tr>
									<tr>
										<td>Order DateTime</td>
										<td>${result[0].create_at}</td>
									</tr>
								</tbody>
							</table>
							<div class="d-flex justify-content-center mt-3">
								<button onclick="printOrder()" class="btn btn-primary">Print</button>
							</div>
						</div>
					</div>
				</div>`
		//resultRow = `<p><b>Order ID</b></p><p>${result[0].order_id}</p>` + resultRow + `<p><b>Total Amount</b></p><p>${result[0].total_amount}</p>`;
		callback(null, resultRow);	
	});
}

function removeItem(callback, item) {
	let deleteQuery = `DELETE from order_items where order_item_id = '${item}'`;

	connection.query(deleteQuery, (err, result) => {
		if (err) {
			console.error('Error updating data:' + err.message);
		}			
		callback(null, "successfully");	
	});
}

function getCategories(callback, action) {
	let selectQuery = `select categories_id, parent_categories_id, categories_name from categories`;

	let resultRow = "";
	let categoriesTemp = "";
	let subCategoriesTemp = "";
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			console.error('Error updating data:' + err.message);
		}
		result.forEach((row) => {
			if (row.parent_categories_id == -1){
				categoriesTemp += `<option id="${row.categories_id}" name="${row.parent_categories_id}">${row.categories_name}</option>`;
			}
			else {
				subCategoriesTemp += `<option id="${row.categories_id}" name="${row.parent_categories_id}">${row.categories_name}</option>`;
			}
		});

		resultRow = categoriesTemp + ":" + subCategoriesTemp;

		if (action == "categorie") {
			callback(null, resultRow);	
		}
		else if (action == "product") {
			callback(null, resultRow);	
		}	
	});
}

function getCategories_homePage(callback) {
	let selectQuery = `select * from categories`;

	let resultRow = "";
	let categoriesTemp = [];
	let subCategoriesTemp = [];
	
	let tempParent = "";
	let temp = "";
	let temp2 = "";
	let isParent = false;
	
	connection.query(selectQuery, (err, result) => {
		if (err) {
			console.error('Error updating data:' + err.message);
		}
		result.forEach((row) => {
			if (row.parent_categories_id != "-1"){
				subCategoriesTemp.push([row.categories_id, row.parent_categories_id, row.categories_name, `<a href="shop.html?category=${row.categories_id}" id="category${row.categories_id}" name="${row.parent_categories_id}" class="dropdown-item">${row.categories_name}</a>`]);
			}
			else {
				categoriesTemp.push([row.categories_id, row.categories_name]);
			}
		});
		
		for (let i = 0; i < categoriesTemp.length; i++) {
			isParent = false;
			temp = "";
			temp2 = "";
			for (let j = 0; j < subCategoriesTemp.length; j++) {
				if (categoriesTemp[i][0] == subCategoriesTemp[j][1]) {
					isParent = true;
					temp += subCategoriesTemp[j][3];
				}
			}
			if (isParent) {
				temp2 = `
					<div class="nav-item dropdown">
						<a href="#" id="category${categoriesTemp[i][0]}" class="nav-link" data-toggle="dropdown"><label onclick="window.location.href='shop.html?category=${categoriesTemp[i][0]}'">${categoriesTemp[i][1]}</label><i class="fa fa-angle-down float-right mt-1"></i></a>
						<div class="dropdown-menu position-absolute bg-secondary border-0 rounded-0 w-100 m-0">
							${temp}
						</div>
					</div>`;
			}
			else {
				temp2 = `<a href="shop.html?category=${categoriesTemp[i][0]}" id="category${categoriesTemp[i][0]}" class="nav-item nav-link">${categoriesTemp[i][1]}</a>`;
			}
			resultRow += temp2;
		}
		resultRow = `<div class="navbar-nav w-100 overflow-hidden" style="height: ${categoriesTemp * 41}px">` + resultRow + `</div>`;
		callback(null, resultRow);
	});
}

function endDatabaseConnection() {
	connection.end((err) => {
		if (err) {
			console.error('Error closing connection:', err.message);
			return;
		}
		console.log('Connection closed');
	});
}

module.exports = {
    insertCategories,
	updateCategories,
	getCategories,
	insertProduct,
	getSecureityQuestion,
	insertAdminRole,
	getAdminRole,
	insertAdmin,
	getAdmin,
	deleteAdmin,
	deleteRole,
	insertReview,
	getReview,
	getPageProduct,
	insertCartItem,
	getCartItem,
	modifyCartItem,
	createDelivery,
	updateDelivery,
	getDelivery,
	getOrderDelivery,
	getCategories_homePage,
	orderCartItem,
	getOrder,
	removeItem,
	getOrderStatusWhenSuccessfully,
	updateOrderStatusWhenSuccess,
};