import Users from "../../models/user.model";
const { encode, decode } = require("../../middleware/crypt");
const crypto = require("crypto");
import { createTokens } from "../../helper/jwt_auth/jwt_auth";
import nodemailer from "nodemailer";
const CURRENT_USER = "currentUser";
import { handleResponse, encrypt, decrypt } from "../../helper/utility";
import {
  BadRequestError,
  InternalServerError,
  handleError,
  UnauthorizationError,
} from "../../helper/errors/custom-error";
var otpGenerator = require("otp-generator");
const mongoose = require("mongoose");
import { logger, level } from "../../config/logger/logger";

export const register = async (req, res, next) => {
  logger.log(level.info, `✔ Controller register()`);
  try {
    const hashPwd = await encrypt(req.body.password);
    let userData = {
      ...req.body,
      password: hashPwd,
    };
    console.log("userData", userData);
    await Users.createData(userData);
    let dataObject = { message: "User created succesfully" };
    return handleResponse(res, dataObject, 201);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const removeSingleUser = async (req, res, next) => {
  try {
    logger.log(level.info, `✔ Controller removeSingleUser()`);
    const query = { _id: req[CURRENT_USER]._id };
    let removedData = await Users.deleteData(query);
    let dataObject = {
      message: "user deleted successfully.",
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const getAllUser = async (req, res, next) => {
  try {
    logger.log(level.info, `✔ Controller getAllUser()`);
    const userData = await Users.findData({});
    let dataObject = {
      message: "user details fetched successfully.",
      data: userData,
      count: userData.length,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const getSingleUser = async (req, res, next) => {
  try {
    logger.log(level.info, `✔ Controller getSingleUser()`);
    const userData = await Users.findOneDocument({
      _id: mongoose.Types.ObjectId(req.params.userId),
    });
    let dataObject = {
      message: "user details fetched successfully.",
      data: userData,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const updateSingleUser = async (req, res, next) => {
  try {
    logger.log(level.info, `✔ Controller updateSingleUser()`);
    let { userName, email, password, mobile_no, Address, gender, DOB } =
      req.body;
    let updateDeviceObject = {
      userName,
      email,
      mobile_no,
      Address,
      gender,
      DOB,
    };
    if (password) {
      password = await encrypt(password);
      updateDeviceObject = {
        ...updateDeviceObject,
        password,
      };
    }
    let userData = await Users.updateData(
      { _id: mongoose.Types.ObjectId(req[CURRENT_USER]._id) },
      updateDeviceObject
    );
    let dataObject = {
      message: "user details updated successfully.",
      data: userData,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const login = async (req, res, next) => {
  try {
    logger.log(level.info, `✔ Controller login()`);
    const { email, password } = req.body;
    const userData = await Users.findData(
      { email },
      { createdAt: 0, updatedAt: 0 }
    );
    console.log("userData", userData);
    const validateUserData = await decrypt(password, userData[0].password);
    let payload = {
      _id: userData[0]._id,
    };
    let tokens = await createTokens(payload);
    console.log(tokens);
    delete userData[0].password;
    if (validateUserData) {
      let dataObject = {
        message: "User login successfully.",
        data: { userData, token: tokens },
      };
      return handleResponse(res, dataObject);
    }
    return next(new UnauthorizationError());
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
