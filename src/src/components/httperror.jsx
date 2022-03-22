
export default class  HTTPError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  
    toJSON() { 
      return { message: this.message, status: this.status };
    }
  }
  
  // const e = new HTTPError('Fail', 404);
  // // {"nested":{"message":"Fail","status":404},"arr":[{"message":"Fail","status":404}]}
  // console.log(JSON.stringify({
  //   nested: e,
  //   arr: [e]
  // }));