import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';
import { User } from './User';

export const stages = [
  'Order Placed',
  'Buyer Associated',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export interface OrderAttributes {
  id?: number;
  items: string[];
  buyerId?: number | null;
  sellerId?: number | null;
  currentStage: number;
  stageTimestamps?: Record<number, Date>;
  actionLog?: string[];
  deleted?: boolean;
}

export class Order extends Model<OrderAttributes> implements OrderAttributes {
  public id!: number;
  public items!: string[];
  public buyerId!: number | null;
  public sellerId!: number | null;
  public currentStage!: number;
  public stageTimestamps!: Record<number, Date>;
  public actionLog!: string[];
  public deleted!: boolean;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    currentStage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1, max: 7 },
    },
    stageTimestamps: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    actionLog: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
  }
);

Order.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });
Order.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });
