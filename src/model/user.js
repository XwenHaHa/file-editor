/*export */
class User {
  constructor(id, name, username, password, photo, createtime, updatetime) {
    this.id = id;
    this.name = name;
    this.username = username;
    this.password = password;
    this.photo = photo;
    this.createtime = createtime;
    this.updatetime = updatetime;
  }
}

module.exports = {
  User: User,
};
