const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const bcrypt = require("bcrypt")
const uploadFile = require("./awsController")
const mongoose = require("mongoose")
const {
    isValid,
    isValidObjectId,
    isValidRequestBody,
    isValidPassword,
    isValidFiles,
} = require("../validations/validation")
///////---------------------------CREATE PRODUCTS---------------//////////////////////////////

const createProducts = async function (req, res) {
    try {
        const data = req.body;
        const files = req.files;
        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data;
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please provide data to create products" })
        }
        if (!isValidFiles(files)) {
            return res.status(400).send({ status: false, message: "please provide products's image" })
        }

        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: "please provide product's title" })
        }
        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: "Please provide products's descriptions" })
        }
        if (!isValid(price)) {
            return res.status(400).send({ status: false, message: "Please provide products's price" })
        }
        if (!price.match(/^\d+(,\d{1,2})?$/)) {
            return res.status(400).send({ status: false, message: "Price should be in number" })
        }
        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "please provide currencyId" })
        }
        if (!currencyId.match(/^(INR|inr|Inr)$/)) {
            return res.status(400).send({ status: false, message: "currencyId should be in Indian currency format" })
        }
        if (!isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "Please provide currency format" })
        }
        if (currencyFormat !== '₹') {
            return res.status(400).send({ status: false, message: "currency format only in '₹' format" })
        }
        if (isFreeShipping) {
            if (!isFreeShipping.match(/^(true|false)$/)) {
                return res.status(400).send({ status: false, message: "Freeshiping is only boolean value" })
            }
        }
        if (!availableSizes) {
            return res.status(400).send({ status: false, message: "Please provide atleast one size" })
        }
        if (availableSizes) {
            var availableSize = availableSizes.toUpperCase().split(",")
            if (availableSize.length === 0) {
                return res.status(400).send({ status: false, message: "Please provide atleast one size of the products" })
            }
            let enumArray = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            for (let i = 0; i < availableSize.length; i++) {
                if (!enumArray.includes(availableSize[i])) {
                    return res.status(400).send({ status: false, message: `size should be in ${enumArray}` })
                }
            }

        }
        if (installments) {
            if (!installments.match(/^\d+(,\d{1,2})?$/)) {
                return res.status(400).send({ status: false, message: "Installment should be in number and not empty" })
            }
        }

        const isTitleExist = await productModel.findOne({ title: title })
        if (isTitleExist) return res.status(400).send({ status: false, message: "title is already registered" })//check uniqueness



        const productPhoto = await uploadFile(files[0])

        const productData = {
            title: title,
            description: description,
            price: price,
            currencyId: currencyId,
            currencyFormat: currencyFormat,
            isFreeShipping: isFreeShipping,
            style: style,
            productImage: productPhoto,
            availableSizes: availableSize,
        }
        if (data.installments) {
            productData.installments = data.installments
        }

        const createProduct = await productModel.create(productData)
        res.status(201).send({
            status: true,
            message: "Success",
            data: createProduct,
        })




    } catch (error) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createProducts }