const me = async (req, res, next) => {
  res.status(200).send('Heyy, it\'s you!')
}

const editUser = async (req, res, next) => {
  res.status(200).send('Finna be edited!')
}

const registerUser = async (req, res, next) => {
  res.status(200).send('I\'m In baby!')
}

const loginUser = async (req, res, next) => {
  res.status(200).send('Logged in once again!')
}

const logout = async (req, res, next) => {
  res.status(200).send('I have to leave!')
}

const forgotPassword = async (req, res, next) => {
  res.status(200).send('Ummm, I forgot!')
}

const allUsers = async (req, res, next) => {
  res.status(200).send('Shhhh! It\'s all our users')
}

const resetPassword = async (req, res, next) => {
  res.status(200).send('I got the code, I just wanna change it!')
}

export { me, editUser, registerUser, loginUser, logout, forgotPassword, resetPassword, allUsers }