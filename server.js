const express = require('express');
const http = require('http');
const stripe = require('stripe')('sk_test_51Qo2BgRvAcFq2AQeYhKDfJx2GLPzsO2xojsi55laFwrthN5mVjppEmh6lSTaYeqdygRjmvnJgRsDTEwnSkec0IIl00tGM3BEQ3');
const https = require('https');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const multer = require("multer");
const util = require("util");
const fileUpload = require('express-fileupload');

require('dotenv').config();
const socketio = require('./socketio.js');
const { getOrder, 
	updateOrderStatusWhenSuccess, 
	getOrderStatusWhenSuccessfully, 
	removeItem, 
	orderCartItem, 
	getCategories_homePage, 
	getOrderDelivery, 
	updateDelivery, 
	getDelivery, 
	createDelivery, 
	modifyCartItem, 
	getCartItem, 
	insertCartItem, 
	getPageProduct, 
	getReview, 
	insertReview, 
	deleteRole, 
	deleteAdmin, 
	getAdmin, 
	insertCategories, 
	getCategories, 
	updateCategories, 
	insertProduct, 
	getSecureityQuestion, 
	insertAdminRole, 
	getAdminRole, 
	insertAdmin} = require('./mysqlcontroller.js');

const app = express();
const httpApp = express();

//const server = https.createServer(options, app);
const server = http.createServer(app);

const PORT = process.env.PORT || 8080;

// CORS Configuration
const corsOptions = {
    origin: 'http://localhost', // Correct the typo in the origin URL
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'], // Include necessary methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Consolidated headers
    credentials: true // Allow credentials if needed
};


httpApp.get("*", function(req, res, next) {
    res.redirect("https://" + req.headers.host + req.path);
});

/*http.createServer(httpApp).listen(80, function() {
    console.log("Express TTP server listening on port 80");
});*/

app.use(fileUpload());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
	
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
	
	// Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

socketio(server);

const SDK_KEY = 'GqEfhAZyM5WaPnynI3CH3qUraT2gK9hHItky'; // Replace with your SDK key
const SDK_SECRET = '3zWTa0YQzPSSGDRKJG9E5ep7bc0jqAfHvQTz'; // Replace with your SDK secret

app.get('/jwt', (req, res) => {
	const token = generateSignature(SDK_KEY, SDK_SECRET, req.query.sessionName, parseInt(req.query.role), '', req.query.userId);
    res.json({ token });
});

app.post('/create_product', (req, res) => {
	const { name, price, description, detail, stockLevel, parentCategorie, subCategories, url, detailFileNames, productDesplayIconNames} = req.body;
	if (!name || !price || !description || !detail || !stockLevel || !parentCategorie) {
		return res.status(400).send('Please provide the full body.');
	}
	const product_id = url;
	
	const filePath = path.join(__dirname, 'public/products/' + url + "/" + url + ".html");
	const fileBakPath = path.join(__dirname, 'public/products/' + url + "/" + url + ".txt");
	if (!fs.existsSync(path.join(__dirname, 'public/products/'))) {
		fs.mkdirSync(path.join(__dirname, 'public/products/')); // Create 'products' directory if it doesn't exist
	}
	if (!fs.existsSync(path.join(__dirname, 'public/products/' + url))) {
		fs.mkdirSync(path.join(__dirname, 'public/products/' + url)); // Create 'products' directory if it doesn't exist
	}
	if (!fs.existsSync(path.join(__dirname, 'public/products/' + url + "/images/"))) {
		fs.mkdirSync(path.join(__dirname, 'public/products/' + url + "/images/")); // Create 'products' directory if it doesn't exist
	}
	if (!fs.existsSync(path.join(__dirname, 'public/products/' + url + "/displayImages/"))) {
		fs.mkdirSync(path.join(__dirname, 'public/products/' + url + "/displayImages/")); // Create 'products' directory if it doesn't exist
	}
	
	let displayImageUrl = 'products/' + url + "/displayImages/";
	
	if (req.files && req.files.productDesplayIcon && productDesplayIconNames) {
		const imageFilePath = 'public/products/' + url + "/images/";
		if (req.files.detailFiles) {
			if (Array.isArray(req.files.detailFiles)) {
				for (let i = 0; i < req.files.detailFiles.length; i++) {
					req.files.detailFiles[i].mv(imageFilePath + detailFileNames[i], (err) => {
						if (err) {
							console.error(err);
							return res.status(500).send('Failed to save the image file.');
						}
					});
				}
			}
			else {
				req.files.detailFiles.mv(imageFilePath + detailFileNames, (err) => {
					if (err) {
						console.error(err);
						return res.status(500).send('Failed to save the image file.');
					}
				});
			}
		}
		
		const displayFilesPath = 'public/products/' + url + "/displayImages/";
		if (Array.isArray(req.files.productDesplayIcon)) {
			for (let i = 0; i < req.files.productDesplayIcon.length; i++) {
				
				req.files.productDesplayIcon[i].mv(displayFilesPath + productDesplayIconNames[i], (err) => {
					if (err) {
						console.error(err);
						return res.status(500).send('Failed to save the image file.');
					}
				});
			}
			displayImageUrl += productDesplayIconNames[0];
		}
		else {
			req.files.productDesplayIcon.mv(displayFilesPath + productDesplayIconNames, (err) => {
				if (err) {
					console.error(err);
					return res.status(500).send('Failed to save the image file.');
				}
			});
			displayImageUrl += productDesplayIconNames;
		}
	}
	else {
		return res.status(400).send('Please upload display images');
	}
	
	fs.readFile(path.join(__dirname, 'contentTemplate/productTemplate.html'), 'utf8', (err, data) => {
		let bakData = data;
		
		if (err) {
		  console.error('Error reading template:', err); // Log the error for debugging
		  return res.status(500).send('Failed to read the template file.');
		}
	
		data = data.replace("${name}", name);
		data = data.replace("${price}", price);
		data = data.replace("${description}", description);
		data = data.replace("${detail}", detail);
		data = data.replace("${stockLevel}", stockLevel);
		
		if (req.files.detailFiles) {
			if (Array.isArray(req.files.detailFiles)) {
				for (let i = 0; i < req.files.detailFiles.length; i++) {
					data = data.replace("(img){" + detailFileNames[i] + "}", '<img src="' + 'http://localhost/website/public/products/' + url + "/images/" + detailFileNames[i] + '"width="1600" height="900"/>');
				}
			}
			else {
				data = data.replace("(img){" + detailFileNames + "}", '<img src="' + 'http://localhost/website/public/products/' + url + "/images/" + detailFileNames + '"width="1600" height="900"/>');
			}
		}

		if (req.files.productDesplayIcon) {
			if (Array.isArray(req.files.productDesplayIcon)) {
				data += `<script> document.getElementById("productDesplayIconDiv").innerHTML = '`;
				data += `<div class="carousel-item active">`;
				data += `<img class="w-100 h-100" src="http://localhost/website/public/products/${url}/displayImages/${productDesplayIconNames[0]}" />`;
				data += `</div>`;
				for (let i = 1; i < req.files.productDesplayIcon.length; i++) {
					data += `<div class="carousel-item">`;
					data += `<img class="w-100 h-100" src="http://localhost/website/public/products/${url}/displayImages/${productDesplayIconNames[i]}" />`;
					data += `</div>`;
				}
			}
			else {
				data += `<script>document.getElementById("productDesplayIconDiv").innerHTML = '`;
				data += `<div class="carousel-item active">`;
				data += `<img class="w-100 h-100" src="http://localhost/website/public/products/${url}/displayImages/${productDesplayIconNames}" />`;
				data += `</div>`;
			}
		}
		data += `';</script>`;
		data += `<script> const productId = "${url}"; </script>`;
		data += `<script src="../../js/globalFunction.js"></script>
				<script src="../../js/productPage.js"></script>`;
		insertProduct((err, result) => {
			if (err) {
				return res.status(500).send('Error:', err.message);
			}
			fs.writeFile(filePath, data, (err) => {
				if (err) {
					return res.status(500).send('Failed to save product HTML file.');
				}
				fs.writeFile(fileBakPath, bakData, (err) => {
					if (err) {
						return res.status(500).send('Failed to save product HTML file.');
					}
				});
			});

			try {
				const productCreated = stripe.products.create({
					name: name,
					description: description,
					default_price_data: {
						currency: 'hkd',
						unit_amount: parseFloat(price) * 100, // Convert to cents
					},
				});
			} catch (error) {
				res.status(500).json({ error: error.message });
			}
			res.status(200).send(`Product page created successfully! File saved at: ${filePath}`);
		}, product_id, name, price, "products/" + url + "/" + url + ".html", displayImageUrl, description, detail, parentCategorie, stockLevel);		
	});
});

app.post('/get_cartItem', async (req, res) => {
    const { userId, isOrder } = req.body;
    if (!userId || !isOrder) {
        return res.status(400).send('Please provide the full body.');
    }

    try {
        const result = await getCartItem(userId, isOrder); // Call the async function
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/modify_cartItem', async (req, res) => {
    const { productGridId, quantity } = req.body;
    if (!productGridId || !quantity) {
        return res.status(400).send('Please provide the full body.');
    }

    modifyCartItem((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		return res.status(200).send(result);
	}, productGridId, quantity);
});

app.post('/getProductContent', (req, res) => {
	const { page, minPrice, maxPrice, method, productName, productCategory} = req.body;
	if (!page) {
		return res.status(400).send('Please provide the full body.');
	}
	
	getPageProduct((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		return res.status(200).send(result);
	}, page, minPrice, maxPrice, method, productName, productCategory);
});

app.post('/create_admin', (req, res) => {
	const { name, email, adminPassword, roleId, isActive} = req.body;
	if (!name || !email || !adminPassword || !roleId || !isActive) {
		return res.status(400).send('Please provide the full body.');
	}
	
	insertAdmin((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		return res.status(200).send('Admin inserted successfully! ' + result);
	}, name, email, adminPassword, roleId, isActive);
});

app.post('/order', async (req, res) => {
	const { userId } = req.body;
	if (!userId) {
		return res.status(400).send('Please provide the full body.');
	}
	orderCartItem((err, result) => {
		if (err) {		
			return res.status(500).send('Error:', err.message);
		}
		return res.status(200).send(result);
	}, userId);
});

app.post('/orderStatus', async (req, res) => {
	const { order } = req.body;
	if (!order) {
		return res.status(400).send('Please provide the full body.');
	}
	getOrderStatusWhenSuccessfully((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		return res.status(200).send(result);
	}, order);
});

app.post('/updateOrderStatusWhenSuccess', async (req, res) => {
	const { order } = req.body;
	if (!order) {
		return res.status(400).send('Please provide the full body.');
	}
	updateOrderStatusWhenSuccess((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		return res.status(200).send(result);
	}, order);
});

app.post('/add_cartItem', (req, res) => {
	const { productId, userId, quantity} = req.body;
	if (!productId || !userId || !quantity) {
		return res.status(400).send('Please provide the full body.');
	}
	
	insertCartItem((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		return res.status(200).send(result);
	}, productId, userId, quantity);
});

app.post('/insert_review', (req, res) => {
	const { productId, userId, userIconUrl, userName, reviewMessage, isActive} = req.body;
	if (!productId || !userId || !userName || !reviewMessage || !isActive) {
		return res.status(400).send('Please provide the full body.');
	}
	insertReview((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		return res.status(200).send('Rewiew inserted successfully! ' + result);
	}, productId, userId, userName, userIconUrl, userName, reviewMessage, isActive);
});

app.post('/create_role', (req, res) => {
	const { name, description } = req.body;	
	
	if (!name || !description) {
		return res.status(400).send('Please provide the full body.');
	}
	
	insertAdminRole((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send('Admin role inserted successfully! ' + result);
	}, name, description);
});

app.post('/create_delivery', (req, res) => {
	const { userId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode, isPrimary} = req.body;	
	
	const cityCode2 = '000000';
	
	if (!userId || !firstName || !lastName || !contactEmail || !contactPhone || !address1 || !address2 || !region || !cityArea || !city || !cityCode2 || !isPrimary) {
		return res.status(400).send('Please provide the full body.');
	}
	
	createDelivery((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send('Delivery inserted successfully! ' + result);
	}, userId, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode2, isPrimary);
});

app.post('/update_delivery', (req, res) => {
	const { userId, deliveryGroup, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode, isPrimary} = req.body;	
	
	const cityCode2 = '000000';
	
	if (!userId || !deliveryGroup || !firstName || !lastName || !contactPhone || !contactEmail || !address1 || !address2 || !region || !cityArea || !city || !cityCode2 || !isPrimary) {
		return res.status(400).send('Please provide the full body.');
	}
	
	updateDelivery((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send('Delivery inserted successfully! ' + result);
	}, userId, deliveryGroup, firstName, lastName, contactPhone, contactEmail, address1, address2, region, cityArea, city, cityCode2, isPrimary);
});

app.post('/get_order', (req, res) => {
	
	const {userId} = req.body;
	
	if (!userId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	getOrder((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send(result);
	}, userId);
});

app.post('/remove_item', (req, res) => {
	
	const {item} = req.body;
	
	if (!item) {
		return res.status(400).send('Please provide the full body.');
	}
	
	removeItem((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send(result);
	}, item);
});

app.post('/get_delivery', (req, res) => {
	
	const {userId} = req.body;
	
	if (!userId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	getDelivery((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send(result);
	}, userId);
});

app.post('/get_OrderDelivery', (req, res) => {
	
	const {userId} = req.body;
	
	if (!userId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	getOrderDelivery((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send(result);
	}, userId);
});

app.post('/get_role', (req, res) => {
	getAdminRole((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send(result);
	});
});

app.post('/get_admin', (req, res) => {
	getAdmin((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send(result);
	});
});

app.post('/get_review', (req, res) => {
	const { productId } = req.body;
	
	if (!productId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	getReview((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send(result);
	}, productId);
});

app.post('/delete_admin', (req, res) => {
	const { adminId} = req.body;
	deleteAdmin((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send(result + "successfully");
	}, adminId);
});

app.post('/delete_role', (req, res) => {
	const { roleId} = req.body;
	deleteRole((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send(result + "successfully");
	}, roleId);
});

app.post('/create_user', (req, res) => {
	const { action, categorieName, parentCategorie, categorieDescription } = req.body;	
	
	if (!action || !categorieName || !parentCategorie || !categorieDescription) {
		return res.status(400).send('Please provide the full body.');
	}
	
	insertCategories((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send('Category inserted successfully! ' + result);
	}, categorieName, parentCategorie, categorieDescription);
});

app.post('/create_categorie', (req, res) => {
	const { action, categorieName, parentCategorie, categorieDescription } = req.body;	
	
	if (!action || !categorieName || !parentCategorie || !categorieDescription) {
		return res.status(400).send('Please provide the full body.');
	}
	insertCategories((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send('Category inserted successfully! ' + result);
	}, categorieName, parentCategorie, categorieDescription);
});

app.post('/update_categorie', (req, res) => {
	const { action, categorieId, categorieName, parentCategorie, categorieDescription } = req.body;	
	if (!action || !categorieId|| !categorieName || !parentCategorie || !categorieDescription) {
		return res.status(400).send('Please provide the full body.');
	}
	
	updateCategories((err, result) => {
		if (err) {
			return res.status(500).send('Error:', err.message);
		}
		res.status(200).send('Category updateed successfully! ' + result);
	}, action, categorieId, categorieName, parentCategorie, categorieDescription);
});

app.post('/delete_categorie', (req, res) => {
	const action = req.body;	
	if (!action || !categorieId) {
		return res.status(400).send('Please provide the full body.');
	}
	
	updateCategories((err, result) => {
		if (err) {
				return res.status(500).send('Error:', err.message);
			}
		res.status(200).send('Category deleted successfully! ' + result);
	}, action, categorieId);
});

app.post('/get_categorie', (req, res) => {
	const { action } = req.body
	getCategories((err, categories) => {
        if (err) {
            return res.status(500).send('Error fetching categories');
        }
        res.status(200).send(categories); // Send the result as JSON
    }, action);
});

app.post('/get_categorie_homePage', (req, res) => {
	
	getCategories_homePage((err, categories) => {
        if (err) {
            return res.status(500).send('Error fetching categories');
        }
        res.status(200).send(categories); // Send the result as JSON
    });
});

app.post('/getSecureityQuestion', (req, res) => {
	const { action } = req.body
	getSecureityQuestion((err, question) => {
        if (err) {
            return res.status(500).send('Error fetching categories');
        }
        res.status(200).send(question); // Send the result as JSON
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
const KJUR = require('jsrsasign')
// https://www.npmjs.com/package/jsrsasign

function generateSignature(sdkKey, sdkSecret, sessionName, role, sessionKey, userIdentity) {

  const iat = Math.round(new Date().getTime() / 1000) - 30
  const exp = iat + 60 * 60 * 2
  const oHeader = { alg: 'HS256', typ: 'JWT' }

  const oPayload = {
    app_key: sdkKey,
    tpc: sessionName,
    role_type: role,
    session_key: sessionKey,
    user_identity: userIdentity,
    version: 1,
    iat: iat,
    exp: exp,
	audio_webrtc_mode: 1
  }

  const sHeader = JSON.stringify(oHeader)
  const sPayload = JSON.stringify(oPayload)
  const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, sdkSecret)
  return sdkJWT
}