const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const orderModel = require("../models/orderModel")
const { isValid, isValidObjectId, isValidRequestBody } = require("../validations/validation");

const createOrder = async function (req, res) {
     try {
        let userId = req.params.userId;
        let data = req.body;
        let { cartId, cancellable, status } = data;

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId" })
        }
        let existUser = await userModel.findById(userId);
        if (!existUser) {
            return res.status(404).send({ status: false, message: "User is not exist or already deleted" })
        }
        //authorization
        if (userId !== req.userId) {
            return res.status(403).send({ status: false, message: " User Authorization failed" })
        }
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please give some data to create an order" })
        }
        if (!isValid(cartId)) {
            return res.status(400).send({ status: false, message: "Please provide cartId" })
        }
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Invalid cartId" })
        }
        let existCart = await cartModel.findOne({ _id: cartId, userId: userId })
        if (!existCart) {
            return res.status(404).send({ status: false, message: "given Cart is not exist for this particuler user" })
        }
        let itemArr = existCart.items
        if (itemArr.length == 0) {
            return res.status(400).send({ status: false, message: "Cart Is empty" })
        }
        let total = 0;
        for (let i of itemArr) {
            total = total + i.quantity
        }
        let orderDetails = {
            userId: userId,
            items:itemArr,
            totalPrice: existCart.totalPrice,
            totalItems: existCart.totalItems,
            totalQuantity: total,
            
        }
        if(cancellable){
            if(!isValid(cancellable)){
                return res.status(400).send({status:false,message:"please provide cancelation property "})
            }
            var cancel = cancellable.toString().trim().toLowerCase();
            if(!/^(true|false)$/.test(cancel)){
                    return res.status(400).send({status:false,message:"cancellable should be a boolean value"})
            }
        }
        orderDetails.cancellable = cancel;
        if(status){
            if(!isValid(status)){
                return res.status(400).send({status:false,message:"please provide status property"})
            }
            var stat = status.trim().toLowerCase();
            if(!['pending','completed','cancelled'].includes(stat)){
                return res.status(400).send({status:false,message:"Status should be 'pending','completed','cancelled'"})
            }
        }
        orderDetails.status = stat

        let orderCreate = await orderModel.create(orderDetails)
        
        return res.status(201).send({status:true,message:"success",data:orderCreate})


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
//////////////////////////////////////////////------Update Order----------///////////////////////////////////////////////////////////
const updateOrder = async function(req,res){
    try {
        let userId = req.params.userId;
        let data = req.body;
        let orderId = data.orderId;

        if(!isValidObjectId(userId)){
            return res.status(400).send({status:false,message:"Invalid UserId"})
        }
        if(userId !==req.userId){
            return res.status(403).send({status:false,message:"Authorization failed"})
        }
        if(!isValidRequestBody(data)){
            return res.status(400).send({status:false,message:"Please provide data for cancled your order"})
        }
        if(!isValid(orderId)){
            return res.status(400).send({status:false,message:"Please provide your orderId correctly"})
        }
        if(!isValidObjectId(orderId)){
            return res.status(400).send({status:false,message:"Invalid orderId"})
        }
        let findOrder = await orderModel.findOne({userId:userId,_id:orderId,isDeleted:false})
        if(!findOrder){
            return res.status(404).send({status:false,message:"order is not found for this user"})
        }
        if(findOrder.cancellable !==true){
            return res.status(400).send({status:false,message:"You can not cancelled this order"})
        }
        let updateOrder = await orderModel.findOneAndUpdate({_id:orderId},{status:"cancelled",isDeleted:true,deletedAt:Date.now()},{new:true})
        return res.status(200).send({status:true,message:"Success",data:updateOrder})


    } catch (error) {
        return res.status(500).send({status:false,message:error.message})
    }
}

module.exports = {createOrder,updateOrder}