const userModel = require("../models/userModel")
const bcrypt = require("bcrypt")
const uploadFile = require("./awsController")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const {
    isValid,
    isValidObjectId,
    isValidRequestBody,
    isValidPassword,
    isValidFiles,
} = require("../validations/validation")
let saltRounds = 10

/*************Create User (1st Api)*******************************/
const userRegister = async (req, res) => {
    try {
        let data = req.body

        if (!isValidRequestBody(data))
            return res.status(400).send({
                status: false,
                message: "Request body can't be empty",
            })

        const { fname, lname, email, phone, password, address } = data

        const files = req.files
        if (!isValidFiles(files))
            return res.status(400).send({
                status: false,
                Message: "Please provide user's profile picture",
            })


        if (!isValid(fname)) return res.status(400).send({ status: false, Message: "Please provide your first name" })
        if (!fname.trim().match(/^[a-zA-Z ]{2,30}$/))
            return res.status(400).send({
                status: false,
                message: "Firstname should only contain alphabet",
            })

        if (!isValid(lname)) return res.status(400).send({ status: false, Message: "Please provide your last name" })
        if (!lname.trim().match(/^[a-zA-Z ]{2,30}$/))
            return res.status(400).send({
                status: false,
                message: "lastname should only contain alphabet",
            })

        if (!isValid(email)) return res.status(400).send({ status: false, Message: "Please provide your email address" })

        if (!isValid(phone))
            return res.status(400).send({
                status: false,
                Message: "Please provide your phone number",
            })

        if (!isValid(password)) return res.status(400).send({ status: false, Message: "Please provide your password" })

        if (!isValid(address)) return res.status(400).send({ status: false, Message: " Address must be provide" })

        let jsonAddress = JSON.parse(address)
        if (typeof jsonAddress != "object")
            return res.status(400).send({ status: false, message: "Address must be in object" })

        if (jsonAddress) {
            if (jsonAddress.shipping) {
                if (!isValid(jsonAddress.shipping.street))
                    return res.status(400).send({
                        status: false,
                        Message: "Please provide your street name in shipping address",
                    })

                if (!isValid(jsonAddress.shipping.city))
                    return res.status(400).send({
                        status: false,
                        Message: "Please provide your city name in shipping address",
                    })

                if (!isValid(jsonAddress.shipping.pincode))
                    return res.status(400).send({
                        status: false,
                        Message: "Please provide your pin code in shipping address",
                    })

                if (!/^\d{6}$/.test(jsonAddress.shipping.pincode))
                    return res.status(400).send({
                        status: false,
                        message: "Pincode should in six digit Number",
                    })
            } else {
                return res.status(400).send({ status: false, message: "please provide shipping address" })
            }

            if (jsonAddress.billing) {
                if (!isValid(jsonAddress.billing.street))
                    return res.status(400).send({
                        status: false,
                        Message: "Please provide your street name in billing address",
                    })

                if (!isValid(jsonAddress.billing.city))
                    return res.status(400).send({
                        status: false,
                        Message: "Please provide your city name in billing address",
                    })

                if (!isValid(jsonAddress.billing.pincode))
                    return res.status(400).send({
                        status: false,
                        Message: "Please provide your pin code in billing address",
                    })
                if (!/^\d{6}$/.test(jsonAddress.billing.pincode))
                    return res.status(400).send({
                        status: false,
                        message: "Pincode should in six digit Number",
                    })
            } else {
                return res.status(400).send({ status: false, message: "please provide billing address" })
            }
        }

        /***************************Email, Phone & Password Validations******************/

        let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/
        let phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/

        if (!email.trim().match(emailRegex))
            return res.status(400).send({ status: false, message: "Please enter valid email" })

        if (!phone.trim().match(phoneRegex))
            return res.status(400).send({ status: false, message: "Please enter valid phone number" })

        if (!isValidPassword(password))
            return res.status(400).send({
                status: false,
                message: "Please provide a valid password ,Password should be of 8 - 15 characters",
            })

        /************************************Check duplicity*****************/

        const isRegisterEmail = await userModel.findOne({ email: email })

        if (isRegisterEmail) return res.status(400).send({ status: false, message: "Email id already registered" })

        const isRegisterPhone = await userModel.findOne({ phone: phone })

        if (isRegisterPhone) return res.status(400).send({ status: false, message: "phone number is already registered" })

        /********************************************************************************/

        const profilePicture = await uploadFile(files[0])

        const encryptPassword = await bcrypt.hash(password, saltRounds)

        const userData = {
            fname: fname,
            lname: lname,
            profileImage: profilePicture,
            email: email,
            phone: phone,
            password: encryptPassword,
            address: jsonAddress,
        }

        const createUser = await userModel.create(userData)

        res.status(201).send({
            status: true,
            message: `User registered successfully`,
            data: createUser,
        })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
////////////////////////-----login User-----///////////////////////////////////////////
const loginUser = async function (req, res) {
    try {
        let { email, password } = req.body;
        if(!Object.keys(req.body).length){
            return res.status(400).send({status:false,message:"Body can not be empty!"})
        }
        if (!isValid(email)) return res.status(400).send({ status: false, msg: "email must be given" })
            // Email Validation
        if (!email.trim().match(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/))
            return res.status(400).send({ status: false, message: "Please enter valid email" })

        if (!isValid(password)) return res.status(400).send({ status: false, msg: "password must be given" })  // Passsword Validation


        if (!isValidPassword(password))
            return res.status(400).send({
                status: false,
                message: "Please provide a valid password ,Password should be of 8 - 15 characters",
            })
        


        let user = await userModel.findOne({ email: email})    // DB Call

        if (!user) { return res.status(404).send({ status: false, msg: "email or the password is invalid!" }) }

        const passwordMatch = await bcrypt.compare(password,user.password)
        if(!passwordMatch){
            return res.status(400).send({status:false,Message:"Incorrect password"})
        }


        let token = jwt.sign(                         // JWT Creation
            {
                userId: user._id.toString(),
                group: "twenty-four",                                      // Payload
                project: "ProductsManagement",
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 48 * 60 * 60
            },
            "group24-project5"              // Secret Key 
        )
        return res.status(200).send({ status: true,message: "User login successfull", data:{userId:user._id,token:token}})

    }
    catch (err) {
        console.log("This is the error:", err.message)
        return res.status(500).send({ status: false, msg: err.message })
    }
}
///////////////////////////////////////---------get User Profile-------------/////////////////////////////////////
const getUserProfile = async function (req, res){
try {
    let userId = req.params.userId
    if(!isValidObjectId(userId)){
        return res.status(400).send({status:false,message:"Please enter a valid user Id"})
    }

    let findUser = await userModel.findById({ _id: userId })

    if (!findUser)
    return res.status(404).send({ status: false, message: `no User found by this userID: ${userId}` }
    );

    let userDetails = await userModel.findById({_id:userId}).select({address:1,billing:1,_id:1,fname:1,lname:1,email:1,profileImage:1,phone:1,password:1,createdAt:1,
    updatedAt:1,
    __v:1})
    res.status(200).send({ status: true, message: "User profile details", data: userDetails })
    
} catch (error) {
    res.status(500).send({ status: false, Error: error.message });
}
}




module.exports = { userRegister, loginUser,getUserProfile }