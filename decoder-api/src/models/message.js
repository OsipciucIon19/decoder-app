module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
      "Message",
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        temperature: {
          type: DataTypes.FLOAT,
          allowNull: false
        },
        humidity: {
          type: DataTypes.FLOAT,
          allowNull: false
        },
        battery: {
          type: DataTypes.FLOAT,
          allowNull: false
        },
        temperatureExt: {
          type: DataTypes.FLOAT,
          allowNull: false
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      {
        underscored: true
      }
    );
  };
  