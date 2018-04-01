module.exports = (controller: any) => {
  /**
   * controller.[文件名].[方法名]
   */
  return {
    'get /': controller.user.user,
    'get /userInfo': controller.user.userInfo
  }
}
