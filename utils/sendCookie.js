const sendCookie = (res, token, statusCode, user) => {
  const days = 1;
  const options = {
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };

  res.cookie("accessToken", token, options);
  return res.status(statusCode).json(user);
};

export default sendCookie;
