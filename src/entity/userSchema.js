const { EntitySchema } = require("typeorm");
const User = require("../model/user").User;

module.exports = new EntitySchema({
  name: "User",
  target: User,
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
    },
    username: {
      type: "varchar",
    },
    password: {
      type: "varchar",
    },
    photo: {
      type: "longtext", // 使用 longtext 来存储大字符串
      nullable: true,
    },
    createtime: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP", // 自动设置创建时间
    },
    updatetime: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP", // 自动设置更新时间
      onUpdate: "CURRENT_TIMESTAMP", // 在修改时更新
    },
  },
});
