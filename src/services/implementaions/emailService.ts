import nodemailer from "nodemailer";
import config from "../../config/config";

import Jwt from "jsonwebtoken";
import { verifyToken } from "../../utils/jwtUtils";

class EmailService {
  static async sentEmail(to: string, subject: string): Promise<void> {
    const emailVerificationToken = Jwt.sign(
      { to, subject },
      config.EMAIL_SECRET as string,
      { expiresIn: "30m" }
    );
    console.log(subject);

    // console.log("email verification token ",emailVerificationToken)
    let verificationLink;
    if (subject === "email verification otp") {
      verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    } else if (subject === "forgot password otp") {
      verificationLink = `${process.env.FRONTEND_URL}/forgot-password?token=${emailVerificationToken}`;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD,
      },
    });

    try {
      await transporter.sendMail({
        from: "NestEve <no-replay@gmail.com>",
        to,
        subject,
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">  
      
    <h2 style="text-align: center;">Please verify your email address to activate your account!</h2>  
    <p style="text-align: center;">Thanks for signing up with NestEve !</p>  
    <p style="text-align: center;">Please click the button below to verify your email address and activate your account.</p>  
         <div style="text-align: center; margin: 20px;">  
            <a href="${verificationLink}" style="display: inline-block; padding: 15px 30px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">Verify Email Address</a>  
         </div>  
    <p style="text-align: center; font-size: 12px; color: #555;">Please note this link will expire within 24 hours.</p>  
    </div>
         
         `,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }
}

export default EmailService;
