const express= require("express")
const router= express.Router()
const middleware = require("../middleware/auth")
const productController = require("../controllers/productController")
const userController = require("../controllers/userController")
const cartController = require("../controllers/cartController")
const orderController = require("../controllers/orderController")

/*********************For User**************************************************************/
router.post('/register', userController.userRegister);
router.post("/login",userController.loginUser)
router.get("/user/:userId/profile",middleware,userController.getUserProfile)
router.put('/user/:userId/profile',middleware, userController.updateUser)
/*********************************For Products *********************************************/
router.post('/products', productController.createProducts);
router.get("/products",productController.getProduct)
router.get('/products/:productId', productController.getProductById);
router.delete("/products/:productId",productController.deleteProductById)


router.put('/products/:productId', productController.updateProduct);
/******************************For cart********************************************************/
router.post("/users/:userId/cart",middleware,cartController.createCart)
router.put('/users/:userId/cart',middleware, cartController.updateCart)
router.get("/users/:userId/cart",middleware,cartController.getCart)
router.delete("/users/:userId/cart",middleware,cartController.deleteCart)

router.post("/users/:userId/orders",middleware,orderController.createOrder)








// If Invalid API requested.
router.all("/**", function (req, res) {
    res.status(400).send({
      status: false,
      message: "INVALID END-POINT: The API You requested is NOT available.",
    });
  });

module.exports = router;
