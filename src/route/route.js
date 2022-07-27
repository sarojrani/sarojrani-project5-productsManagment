const express= require("express")
const router= express.Router()
const middleware = require("../middleware/auth")
const productController = require("../controllers/productController")
const userController = require("../controllers/userController")

/*********************For User**************************************************************/
router.post('/register', userController.userRegister);
router.post("/login",userController.loginUser)
router.get("/user/:userId/profile",middleware,userController.getUserProfile)
router.put('/user/:userId/profile',middleware, userController.updateUser)
/*********************************For Products *********************************************/
router.post('/products', productController.createProducts);
router.get('/products/:productId', productController.getProductById);
router.delete("/products/:productId",productController.deleteProductById)


router.put('/products/:productId', productController.updateProduct);








// If Invalid API requested.
router.all("/**", function (req, res) {
    res.status(400).send({
      status: false,
      message: "INVALID END-POINT: The API You requested is NOT available.",
    });
  });

module.exports = router;
