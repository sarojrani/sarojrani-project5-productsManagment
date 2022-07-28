const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const bcrypt = require("bcrypt")
const uploadFile = require("./awsController")
const mongoose = require("mongoose")
const {isValid, isValidObjectId,isValidRequestBody,isValidPassword,isValidFiles,} = require("../validations/validation")
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
        if (!price.trim().match(/^\d+(,\d{1,2})?$/)) {
            return res.status(400).send({ status: false, message: "Price should be in number" })
        }
        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "please provide currencyId" })
        }
        if (!currencyId.trim().match(/^(INR|inr|Inr)$/)) {
            return res.status(400).send({ status: false, message: "currencyId should be in Indian currency format" })
        }
        if (!isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "Please provide currency format" })
        }
        if (currencyFormat.trim() !== '₹') {
            return res.status(400).send({ status: false, message: "currency format only in '₹' format" })
        }
        if (isFreeShipping || isFreeShipping === "") {

            if (!isFreeShipping.trim().match(/^(true|false)$/)) {
                return res.status(400).send({ status: false, message: "Freeshiping is only boolean value" })
            }
        }
        if (!availableSizes) {
            return res.status(400).send({ status: false, message: "Please provide atleast one size" })
        }
        if (availableSizes) {
            var availableSize= availableSizes.replace(/ +/g, "");
            var availableSize = availableSize.toUpperCase().split(",")
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
        if(style|| style===""){
            if(!isValid(style))
            return res.status(400).send({status:false,message:"please provide style"})
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
            installments: installments
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
        return res.status(500).send({ status: false, message: error.message })
    }
}
///////////////////////-------------------------Get Product by Queryparams----------//////////////////////////////
const getProduct = async function (req, res) {
    try {
        let data = req.query;
        let filter = { isDeleted: false }

        if (data.name || data.name === "") {
            if (!isValid(data.name)) {
                return res.status(400).send({ status: false, message: "Enter the product name properly" })
            }

            filter.title = {};
            filter.title["$regex"] = data.name.trim();
            
            // console.log(filter.title)
        }
        if (data.size || data.size === "") {
            if (!isValid(data.size)) {
                return res.status(400).send({ status: false, message: "Give a proper size of products" })
            }
            if (data.size) {
                var size = data.size.replace(/ +/g, "");
                // console.log(size)
                var size = size.toUpperCase().split(",")
                // var size = size.trim()
                 console.log(size)
                if (size.length === 0) {
                    return res.status(400).send({ status: false, message: "please provide the product size" })
                }
                let enumSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                for (let i = 0; i < size.length; i++) {
                    if (!enumSize.includes(size[i])) {
                        return res.status(400).send({ status: false, message: `Sizes should be ${enumSize} value (with multiple value please give saperated by comma)` })
                    }
                }

            }
            filter.availableSizes = {};
            filter.availableSizes["$in"] = size
            // console.log(filter.availableSizes)
        }
        if (data.priceGreaterThan === "" || data.priceLessThan === "") {
            return res.status(400).send({ status: false, message: "price can not be empty" })
        }
        if (data.priceGreaterThan || data.priceLessThan) {
            if (data.priceGreaterThan) {
                if (!isValid(data.priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "pricegreterthen can not be empty" })
                }
                let Gprice = Number(data.priceGreaterThan)
                if (!/^\d*\.?\d*$/.test(Gprice)) {
                    return res.status(400).send({ status: false, message: "price greaterthan should be in a number formate " })
                }
            }
            if (data.priceLessThan) {
                if (data.priceLessThan) {
                    if (!isValid(data.priceLessThan)) {
                        return res.status(400).send({ status: false, message: "pricelessthen can not be empty" })
                    }
                    let Lprice = Number(data.priceLessThan)
                    if (!/^\d*\.?\d*$/.test(Lprice)) {
                        return res.status(400).send({ status: false, message: "price lessthan should be in a number formate " })
                    }
                }

            }
            console.log(data.priceGreaterThan)
            filter.price = {};
            if (data.priceGreaterThan && data.priceLessThan) {
                filter.price["$gt"] = data.priceGreaterThan.trim()
                filter.price["$lt"] = data.priceLessThan.trim()
            }
            else {
                if (data.priceGreaterThan) filter.price["$gt"] = data.priceGreaterThan.trim();
                if (data.priceLessThan) filter.price["$lt"] = data.priceLessThan.trim();
            }


        }

        let sortedPrice = data.priceSort;
        if (sortedPrice) {
            if (!sortedPrice.trim().match(/^(1|-1)$/)) {
                return res.status(400).send({ status: false, message: "priceSort should be 1 or -1" })
            }
            var sort = sortedPrice.trim()
        }


        let get = await productModel.find(filter).sort({ price: sort })
        if (get) {
            return res.status(200).send({ status: true, message: "success", data: get })
        }
        return res.status(400).send({ status: false, message: "No product found" })


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })

    }
}

//////////////////////////////////------Get Products by Id ------------///////////////////////////////////////////////////////////////////////////
const getProductById = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: " Invalid productId" })

        let data = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!data) {
            return res.status(404).send({ status: false, message: "product is already deleted or product not found" })
        }
        return res.status(200).send({ status: true, message: "Success", data: data })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

///////////////////////////////////////--------------Update Product-------------------------////////////////////////////////////////////////
const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        let data = req.body

        let files = req.files

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: " Invalid productId" })


        let checkedProductId = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!checkedProductId) return res.status(404).send({ status: false, message: "ProductId not Exist or already deleted" })

        if (!(files && !Object.keys(data).length)) {
            if (!Object.keys(data).length)
                return res.status(400).send({ status: false, message: "It seems like Nothing to update" })
        }


        if (data.title || data.title === "") {
            if (!isValid(data.title)) return res.status(400).send({ status: false, message: "Please provide title" })
        }


        const isTitleExist = await productModel.findOne({ title: data.title })
        if (isTitleExist) return res.status(400).send({ status: false, message: "title is already registered" })


        if (data.description || data.description === "") {
            if (!isValid(data.description))
                return res.status(400).send({ status: false, message: "Please provide description" })
        }


        if (data.price || data.price === "") {
            if (!isValid(data.price)) return res.status(400).send({ status: false, message: "Please provide price" })
            if (!data.price.match(/^\d*\.?\d*$/))
                return res.status(400).send({ status: false, message: "Price must be positive integer " })
        }

        if (data.currencyId || data.currencyId === "") {
            if (!isValid(data.currencyId))
                return res.status(400).send({ status: false, message: "Please provide currencyId" })
            if (!data.currencyId.match(/^(INR|inr|Inr)$/))
                return res.status(400).send({ status: false, message: "currencyId must be INR" })
        }

        if (files.length !== 0) {
            const productPicture = await uploadFile(files[0])
            data.productImage = productPicture
        }
        if (data.currencyFormat || data.currencyFormat === "") {
            if (!isValid(data.currencyFormat) || data.currencyFormat != "₹")
                return res.status(400).send({ status: false, message: "Please provide currencyFormat ₹" })
        }


        if (data.isFreeShipping || data.isFreeShipping === "") {
            if (!isValid(data.isFreeShipping))
                return res.status(400).send({ status: false, message: "isFreeShipping cant be empty" })

            if (!data.isFreeShipping.toLowerCase().match(/^(true|false|True|False|TRUE|FALSE)$/))
                return res.status(400).send({
                    status: false,
                    message: "Please provide isFreeShipping true/false",
                })
            data.isFreeShipping = data.isFreeShipping.toLowerCase()
        }

        if (data.style || data.style === "") {
            if (!isValid(data.style)) return res.status(400).send({ status: false, message: "Please provide style" })
        }


        if (data.availableSizes === "") {
            if (!isValid(data.availableSizes))
                return res.status(400).send({ status: false, message: "Please provide availableSize" })
        }

        if (data.availableSizes) {
            var availableSize = data.availableSizes.toUpperCase().split(",") //convert in array
            let enumArr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            for (let i = 0; i < availableSize.length; i++) {
                if (!enumArr.includes(availableSize[i])) {
                    return res.status(400).send({
                        status: false,
                        message: `Sizes should be ${enumArr} value (with multiple value please give saperated by comma)`,
                    })
                }

            }
            // console.log(availableSize)
            data.availableSizes = availableSize;
        }


        if (data.installments || data.installments === "") {
            if (!isValid(data.installments))
                return res.status(400).send({ status: false, message: "Please provide installments" })
            if (!data.installments.match(/^\d*\.?\d*$/))
                return res.status(400).send({ status: false, message: "Installment must be positive integer" })
        }

        const updateData = await productModel.findOneAndUpdate({ _id: productId }, data, { new: true })


        if (!updateData) return res.status(404).send({ status: false, message: "Product not found " })

        return res.status(200).send({ status: true, message: "product updated successfully", data: updateData })



    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
///////////////////////////////////-------------Delete Products-----------------//////////////////////////////////////////////
const deleteProductById = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: " Invalid ProductId" })

        let product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product)
            return res.status(404).send({ status: false, message: "This Product does not exist or already Deleted. Please enter correct product ObjectId", })

        let deletedProduct = await productModel.findOneAndUpdate({ _id: productId }, { isDeleted: true, deletedAt: new Date() }, { new: true })
        res.status(200).send({ status: true, message: "Success", data: deletedProduct })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { createProducts, getProductById, updateProduct, deleteProductById, getProduct }