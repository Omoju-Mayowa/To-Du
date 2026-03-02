import argon2 from "argon2";
const hashOptions = {
  type: argon2.argon2id, // For added security
  memoryCost: 2 ** 16, // Uses 64mb of memory to hash password
  hashLength: 48, // Number of characters in the hash
  timeCost: 5, // Number of iterations to hash the password
  parallelism: 5, // Amount of threads used for hashing
};
const password = 'password'
const password2 = 'password22'
const hashed = await argon2.hash(password, hashOptions)

console.log("Password", password)
console.log("Password2", password2)
console.log("Hashed", hashed);

const verify = await argon2.verify(hashed, password2)
if (verify) {
  console.log('correct.')
}
if(!verify) {
  console.log('failed.')
}