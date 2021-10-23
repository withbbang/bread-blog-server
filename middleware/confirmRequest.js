const confirmRequest = (user) => {
  if (!user) throw new Error("Not Confirmed User!");
};

module.exports = { confirmRequest };
