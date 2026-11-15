const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Resident = sequelize.define("Resident", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  roll: { type: DataTypes.INTEGER, allowNull: false },
  room: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: "active" },
});

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
});

module.exports = { sequelize, Resident, User };
