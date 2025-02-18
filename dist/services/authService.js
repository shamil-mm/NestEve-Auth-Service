"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authRepository_1 = __importDefault(require("../repositories/authRepository"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class AuthService {
    registerUser(name, email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield authRepository_1.default.findUserByEmail(email);
            if (existingUser)
                throw new Error("User already exists");
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            return yield authRepository_1.default.createUser({ name, email, password: hashedPassword });
        });
    }
    loginUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield authRepository_1.default.findUserByEmail(email);
            if (!user)
                throw new Error(" User not found ");
            const isMatch = yield bcrypt_1.default.compare(password, user.password);
            if (!isMatch)
                throw new Error("Invalid creadentials");
            const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            return { token, user };
        });
    }
}
exports.default = new AuthService();
