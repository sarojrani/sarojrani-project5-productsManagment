const cartModel = require("../models/cartModel")
const productModel = require("../models/productModel")
const { isValid, isValidObjectId, isValidRequestBody } = require("../validations/validation");

///////////////////////////////////////---------------------------Create Cart----------------/////////////////////////////////

const createCart = async function (req, res) {
  try {
    const data = req.body;

    const userId = req.params.userId;
    let { productId, cartId } = data
    // console.log(userId)
    // console.log(req.userId)

    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: "Please give a valid userId" })

    }
    if (userId !== req.userId) {
      return res.status(403).send({ status: false, message: "You are not able to create the cart" })//authorizaton
    }
    if (!isValidRequestBody(data)) {
      return res.status(400).send({ status: false, message: "Please give some data for create cart" })
    }
    if (cartId) {
      if (!isValid(cartId)) {
        return res.status(400).status({ status: false, message: "cardId should not be empty" })
      }
      if (!isValidObjectId(cartId)) {
        return res.status(400).send({ staus: false, message: "Please provide a valid cartId" })
      }
    }
    if (!isValid(productId)) {
      return res.status(400).send({ status: false, message: "Please provide a productId" })
    }
    if (!isValidObjectId(productId)) {
      return res.status(400).send({ status: false, message: "Please provide a valid productId" })
    }
    const product = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!product) {
      return res.status(404).send({ status: false, message: "product is not exist or already deleted" })
    }
    const cart = await cartModel.findOne({ userId: userId })
    if (!cart) {
      if (cartId) return res.status(400).send({ status: false, message: "This cart is not exist for this particular user" })//when user create cart for first time then he have not any cartId so if he enter a cartid in body then it throw the error
      let addCart = {
        userId: userId,
        items: [{ productId: productId, quantity: 1 }],
        totalPrice: product.price,
        totalItems: 1,
      }


      const create = await cartModel.create(addCart)
      return res.status(201).send({ status: true, message: "Success", data: create })
    }

    if (cart) {
      if (!cartId) {
        return res.status(400).send({ status: false, message: "please provide cartId for this particuler user" })

      }


      if (cart._id.toString() != cartId) {
        return res.status(404).send({ status: false, message: "Cart id is not correct" })
      }
    }

    let arr = cart.items;

    // console.log(arr.length)
    for (let i = 0; i < arr.length; i++) {

      if (arr[i].productId.toString() == productId) {


        arr[i].quantity = arr[i].quantity + 1

        var updateCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: arr, totalPrice: cart.totalPrice + product.price, totalItems: arr.length }, { new: true })

      }




      else {
        let newCart = {
          $addToSet: { items: { productId: product._id, quantity: 1 } },
          totalPrice: product.price + cart.totalPrice,
          totalItems: cart.totalItems + 1
        }
        updateCart = await cartModel.findOneAndUpdate({ userId: userId }, newCart, { new: true })

      }



    }
    return res.status(201).send({ status: true, message: "Success", data: updateCart })






  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}
/////////////////////////////////--------------Update Cart----------------------------///////////////////////////////////////////
const updateCart = async function (req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;
    let { cartId, productId, removeProduct } = data;
    if (!isValidObjectId(userId)) {
      res.status(400).send({ satatus: false, message: "invalid userId" })
    }
    ///authorization
    if (userId !== req.userId) {
      return res.status(403).send({ status: false, message: " User Authorization fail" })
    }///if empty body
    if (!isValidRequestBody(data)) {
      return res.status(400).send({ status: false, message: "please provide data to be update" })

    }
    /////cartId validation
    if (!isValid(cartId)) {
      return res.status(400).send({ status: false, message: "Please provide a cart id" })
    }
    if (!isValidObjectId(cartId)) {
      return res.status(400).send({ status: false, message: "Invalid cartId" })
    }
    /////productId validation
    if (!isValid(productId)) {
      return res.status(400).send({ status: false, message: "Please provide productId" })
    }
    if (!isValidObjectId(productId)) {
      return res.status(400).send({ status: false, message: "Invalid product Id" })
    }
    //////removeProduct validation
    if (!isValid(removeProduct)) {
      return res.status(400).send({ stataus: false, message: "please provide removeProduct " })
    }
    if (!/^(0|1)$/.test(removeProduct)) {
      return res.status(400).send({ status: false, message: "Remove product must be 0 0r 1" })
    }
    let product = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!product) {
      return res.status(404).send({ status: false, message: "Product is not exist or already deleted" })
    }

    let cart = await cartModel.findOne({ _id: cartId, "items.productId": productId })
    //{items:{$elemMatch:{productId:productId}}}

    if (!cart) {
      return res.status(404).send({ status: false, message: "Cart is not exist or product is not available in this cart" })
    }

    if (removeProduct == 1) {
      let updateCart = await cartModel.findOneAndUpdate({ _id: cartId, "items.productId": productId }, { $inc: { totalPrice: -product.price, "items.$.quantity": -1 } }, { new: true })
      // console.log(updateCart.items)

      //  return res.status(200).send({status:true,message:"success",data:updateCart})

      let quantity = updateCart.items.filter((item) => item.productId.toString() === productId)[0].quantity
      if (quantity == 0) {
        let result = await cartModel.findOneAndUpdate({ _id: cartId, "items.prductId": productId }, { $inc: { totalItems: -1 }, $pull: { items: { productId: productId } } }, { new: true })
        return res.status(200).send({ status: true, message: "Success", data: result })
      }
      return res.status(200).send({ status: true, message: "Success", data: updateCart })
    }
    if (removeProduct == 0) {
      let quantity = cart.items.filter((item) => item.productId.toString() === productId)[0].quantity
      let result = await cartModel.findOneAndUpdate({ _id: cartId, "items.productId": productId }, { $inc: { totalPrice: -(product.price * quantity), totalItems: -1 }, $pull: { items: { productId: productId } } }, { new: true })
      return res.status(200).send({ status: true, message:"Success", data: result })

    }


  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}

////////////////////////////////------------Get Cart--------------//////////////////////////////////////////////////////////

const getCart = async function (req, res) {
  try {
    let userId = req.params.userId;
    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: "Please provide a valid userId" })
    }
    // authorization
    if (userId !== req.userId) {
      return res.status(403).send({ status: false, message: "You are not authorized for this cart" })
    }

    const existCart = await cartModel.findOne({ userId: userId })
    if (!existCart) {
      return res.status(404).send({ status: false, message: "Cart is not exist" })
    }
    return res.status(200).send({ status: true, message: "Success", data: existCart })


  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })

  }
}
////////////////////-------------------------Delete Cart------------------//////////////////////////////
const deleteCart = async function (req, res) {
  try {
    let userId = req.params.userId;

    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: "Please provide a correct userId" })
    }
    if (userId !== req.userId) {
      return res.status(403).send({ status: false, message: "You are not authorized for delete this particuler cart" })//authorization
    }
    const existCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalItems: 0, totalPrice: 0 }, { new: true })
    if (!existCart) {
      return res.status(404).send({ status: false, message: "Cart is not exist for this user" })
    }
    return res.status(204).send({ status: true, message: "success", data: existCart })

  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })

  }
}

module.exports = { createCart, getCart, deleteCart, updateCart }