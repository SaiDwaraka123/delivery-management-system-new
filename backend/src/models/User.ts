import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  password?: string;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public role!: 'buyer' | 'seller' | 'admin';
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.ENUM('buyer', 'seller', 'admin'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);
