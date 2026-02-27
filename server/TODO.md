// TODO: Keeping send email functionality for future use
 # My TODO
 
 ## Email Feature (Future Use)
 
 - [ ] Implement Email Functionality
 - [ ] Add dynamic subject and body
 - [ ] Add HTML Template Support
 - [ ] Add attachment support
 
 ```js
 // Import before use also
import { transport, recipients, sender } from "./utils/sendEmail.js";
 
 await transport.sendMail({
   from: sender,
   to: recipients,
   subject: subject,     // string
   text: textBody,       // string (plain text)
   html: htmlBody,       // string (HTML, optional)
 
   // Optional
   attachments: [
     {
       filename: fileName, // string shown to recipient
       path: filePath,     // local path or public URL
 
       // Use one of the following only when needed:
       // content: Buffer.from() or for String just use "(Whatever you want goes here), //buffer Or String
       // encoding: "base64 or hex or utf8 ascii",
 
       // For inline images in HTML:
       // cid: "", // content Id like logo or something you wantm think of it like alt in img 
     },
   ],
 
   // Provider-specific (may not work over SMTP)
   // category: "Integration Test",
 });
``` 
 > FYI before using this code if you need path, attachmen, content, cid and encoding please use variables to set in every instance you reference the mailHelper.
 
 
 ## User verification
- [ ] Implement Password Hashing using argon2
- [ ] Implement JWT token generation and verification
- [ ] Implement Password Reset
- [ ] Implement Login and Signup
 ```js
  const hashOptions = {
    type: argon2.argon2id, // For added security
    memoryCost: 2 ** 16, // Uses 64mb of memory to hash password
    hashLength: 48, // Number of characters in the hash
    timeCost: 5, // Number of iterations to hash the password 
    parallelism: 5, // Amount of threads used for hashing
  }
  const password = 'nox'
  const hash = await argon2.hash(password, hashOptions)
  
  const hashed = await argon2.hash(password, hash)
  console.log(hashed)

 ```