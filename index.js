const makeFetch = require('make-fetch')
const Gun = require('gun')
const fs = require('fs')
const crypto = require("crypto")
require('gun/lib/path')
require('gun/lib/not')
require('./edits/unset')
// require('gun/lib/unset')

const LIST_OF_URLS = ["https://gun-manhattan.herokuapp.com/gun",
"https://us-west.xerberus.net/gun",
"http://gun-matrix.herokuapp.com/gun",
"https://gun-ams1.maddiex.wtf:443/gun",
"https://gun-sjc1.maddiex.wtf:443/gun",
"https://dletta.rig.airfaas.com/gun",
"https://mg-gun-manhattan.herokuapp.com/gun",
"https://gunmeetingserver.herokuapp.com/gun",
"https://e2eec.herokuapp.com/gun",
"https://gun-us.herokuapp.com/gun",
"https://gun-eu.herokuapp.com/gun",
"https://gunjs.herokuapp.com/gun",
"https://www.raygun.live/gun",
"https://gun-armitro.herokuapp.com/",
"https://fire-gun.herokuapp.com/gun"]

/* 

changes to be made


have only one user, save the user data in a user file or a data folder which holds all the info

_ is path
@ is alias
# is key
for now, gun-fetch will have one user that holds the user credentials in a .env file or a file/folder

GET is get
PUT is set
POST is put
PATCH is unset
DELETE is delete(put with null)

a special case is a not query, potential way to do it can be a special character in front of the hostname or a special character in the end of the hostname, maybe an OPTIONS HTTP method can be added

user/auth will be added later
potential ways are
(alias) or !alias for creating/destroying alias
[alias] or $alias for adding and subtracting posts for a user that is currently logged in

have one functionality per http method

*/

module.exports = function makeGunFetch(opts = null){

    const gun = Gun(opts || {peers: LIST_OF_URLS})

    // let user = null

    // if(!fs.existsSync('./data')){
    //     fs.mkdirSync('./data')
    //     fs.writeFileSync('./data/user.txt', crypto.randomBytes(8).toString('hex'))
    //     fs.writeFileSync('./data/pass.txt', crypto.randomBytes(8).toString('hex'))
    //     gun.user().create(fs.readFileSync('./data/user.txt').toString('utf-8'), fs.readFileSync('./data/pass.txt').toString('utf-8'), ack => {
    //         if(ack.err){console.log(ack.err)} else {console.log(ack.pub)}
    //         user = gun.user().auth(fs.readFileSync('./data/user.txt').toString('utf-8'), fs.readFileSync('./data/pass.txt').toString('utf-8'), authen => {
    //             if(authen.err){console.log(authen.err)} else {console.log(authen.soul)}
    //         })
    //     })
    // } else {
    //     if(!fs.existsSync('./data/user.txt') || !fs.existsSync('./data/pass.txt')){
    //         fs.writeFileSync('./data/user.txt', crypto.randomBytes(8).toString('hex'))
    //         fs.writeFileSync('./data/pass.txt', crypto.randomBytes(8).toString('hex'))
    //         gun.user().create(fs.readFileSync('./data/user.txt').toString('utf-8'), fs.readFileSync('./data/pass.txt').toString('utf-8'), ack => {
    //             if(ack.err){console.log(ack.err)} else {console.log(ack.pub)}
    //             user = gun.user().auth(fs.readFileSync('./data/user.txt').toString('utf-8'), fs.readFileSync('./data/pass.txt').toString('utf-8'), authen => {
    //                 if(authen.err){console.log(authen.err)} else {console.log(authen.soul)}
    //             })
    //         })
    //     } else {
    //         user = gun.user().auth(fs.readFileSync('./data/user.txt').toString('utf-8'), fs.readFileSync('./data/pass.txt').toString('utf-8'), authen => {
    //             if(authen.err){console.log(authen.err)} else {console.log(authen.soul)}
    //         })
    //     }
    // }
    
    // // must find out if there is benefit with logging out before exiting before it is added
    // // logout before exit
    // process.on('exit', () => {
    //     user.leave()
    //     process.exit()
    // });

    // //catches ctrl+c event
    // process.on('SIGINT', () => {
    //     user.leave()
    //     process.exit()
    // });
    
    // //catches uncaught exceptions
    // process.on('uncaughtException', () => {
    //     user.leave()
    //     process.exit()
    // });
    // // logout before exit

    const SUPPORTED_METHODS = ['GET', 'PUT', 'DELETE', 'POST', 'PATCH', 'OPTIONS']
    const SUPPORTED_TYPES = ['_', '*', '~', '$', '.']
    const SUPPORTED_OPTIONS = ['!', '$']
    const SUPPORTED_TUNING = ['-', '+', '=', '&']
    const users = {}

    const fetch = makeFetch(async request => {

        if(request.body !== null){
            request.body = await getBody(request.body)
            try {
                request.body = JSON.parse(request.body)
            } catch (error) {
                console.log(error)
            }
        }

        const {url, method, headers, body} = request

          try {
            const {hostname, pathname, protocol} = new URL(url)

              if(protocol !== 'gun:'){
                  return new Error('invalid protocol, must be gun:')
              } else if(!method || !SUPPORTED_METHODS.includes(method)){
                  return new Error('invalid method, must use methods that are supported')
              } else if(!hostname){
                  return new Error('invalid resource, must be a resource that is valid')
              } else if(!SUPPORTED_TYPES.includes(hostname[0])){
                  return new Error('invalid query, must be a supported query')
              } else if(hostname[0] === SUPPORTED_TYPES[4] && !SUPPORTED_OPTIONS.includes(hostname[1])){
                  return new Error('invalid option, must be a supported option')
              } else if(hostname[0] === SUPPORTED_TYPES[4] && hostname[1] === SUPPORTED_OPTIONS[1] && !SUPPORTED_TUNING.includes(hostname[2])){
                  return new Error('invalid tuning, must be a valid tuning')
              }

              let req = formatReq(`${hostname}${pathname}`, method)
            //   console.log(req)
              let query = null
              switch (req.queryType) {
                  case '_':
                      query = req.multiple ? gun.get(req.host).path(req.path) : gun.get(req.host)
                      break
                  case '*':
                      query = req.multiple ? gun.get('~@' + req.host).path(req.path) : gun.get('~@' + req.host)
                      break
                  case '~':
                      query = req.multiple ? gun.user(req.host).path(req.path) : gun.user(req.host)
                      break
                  case '$':
                      query = req.multiple ? user.get(req.host).path(req.path) : user.get(req.host)
                      break

                      // options
                  case '.':
                      if(req.queryOption === '!'){
                          query = req.multiple ? gun.get(req.host).path(req.path) : gun.get(req.host)
                      } else if(req.queryOption === '$'){
                          query = req.host
                      }
                      break
                      // options

              }

              let res = {statusCode: 0, headers: {}, data: null}
              switch (req.queryMethod) {
                case 'GET': {
                      let mainData = await new Promise((resolve) => {
                        query.once(found => {resolve(found)})
                    })
                  res.statusCode = 200
                  res.headers = {}
                  res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                  if(res.data.length){
                      res.headers['Content-Type'] = 'application/json; charset=utf-8'
                  }
                  break
                }
                
                case 'PUT': {
                    let mainData = await new Promise((resolve) => {
                        query.put(body).once(found => {
                            resolve(found)
                        })
                    })
                    res.statusCode = 200
                    res.headers = {}
                    res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                    if(res.data.length){
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    }
                    break
                }

                case 'DELETE': {
                    let mainData = await new Promise((resolve) => {
                        query.put(null).once(found => {resolve(found)})
                    })
                    
                    res.statusCode = 200
                    res.headers = {}
                    res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                    if(res.data.length){
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    }
                    break
                }

                case 'POST': {
                    let mainData = await new Promise((resolve) => {
                        query.set(body).once(found => {resolve(found)})
                    })
                    
                    res.statusCode = 200
                    res.headers = {}
                    res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                    if(res.data.length){
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    }
                    break
                }

                case 'PATCH': {
                    let mainData = await new Promise((resolve) => {
                        query.unset(body).once(found => {resolve(found)})
                    })
                    
                    res.statusCode = 200
                    res.headers = {}
                    res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                    if(res.data.length){
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    }
                    break
                }

                case 'OPTIONS': {
                    if(req.queryOption === '!'){
                        let checkClear = null

                        let mainData = await new Promise((resolve) => {
                            checkClear = setTimeout(() => {resolve({not: false, message: 'timed out, most likely this has data'})}, 5000)
                            query.not(found => {
                                resolve({found, not: true, message: 'done, most likely this does not have data'})
                            })
                        })

                        clearTimeout(checkClear)

                        res.statusCode = 200
                        res.headers = {}
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        }
                    } else if(req.queryOption === '$'){
                        if(req.queryTuning === '-'){
                            if(!users[query]){
                                return {statusCode: 400, headers: {}, data: [JSON.stringify({message: 'User is not logged in'})]}
                            }
                            users[query].leave()
                            delete users[query]
                            let mainData = {message: 'User has been logged out'}
                            res.statusCode = 200
                            res.headers = {}
                            res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                            if(res.data.length){
                                res.headers['Content-Type'] = 'application/json; charset=utf-8'
                            }
                        } else if(req.queryTuning === '+'){
                            if(users[query]){
                                return {statusCode: 400, headers: {}, data: [JSON.stringify({message: 'User is already logged in'})]}
                            }
                            users[query] = gun.user()
                            let mainData = await new Promise((resolve) => {
                                users[query].auth(query, body, ack => {
                                    resolve(ack)
                                })
                            })
                            if(mainData.err){
                                users[query].leave()
                                delete users[query]
                                res.statusCode = 400
                                res.headers = {}
                            } else {
                                res.statusCode = 200
                                res.headers = {}
                            }
                            res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                            if(res.data.length){
                                res.headers['Content-Type'] = 'application/json; charset=utf-8'
                            }
                        } else if(req.queryTuning === '='){
                            let mainData = await new Promise((resolve) => {
                                gun.user().delete(query, body, ack => {
                                    resolve(ack)
                                })
                            })
                            res.statusCode = 200
                            res.headers = {}
                            res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                            if(res.data.length){
                                res.headers['Content-Type'] = 'application/json; charset=utf-8'
                            }
                        } else if(req.queryTuning === '&'){
                            let mainData = await new Promise((resolve) => {
                                gun.user().create(query, body, ack => {
                                    resolve(ack)
                                })
                            })
                            if(mainData.err){
                                res.statusCode = 400
                                res.headers = {}
                            } else {
                                res.statusCode = 200
                                res.headers = {}
                            }
                            res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                            if(res.data.length){
                                res.headers['Content-Type'] = 'application/json; charset=utf-8'
                            }
                        }
                    }
                    break
                }
              }
              return res

          } catch (e) {
              // there was an error
              return {statusCode: 500, headers, data: [e.stack]}
          }
    })

    async function getBody(body) {
        let mainData = ''
      
        for await (const data of body) {
          mainData += data
        }
      
        return mainData
      }

    function formatReq(req, method){
        let split = req.split('/').filter(Boolean)
        let join = split.join('.')
        let count = split.length
        let multiple = count > 1 ? true : false
        let host = split.shift()
        let path = split.length ? split.join('.') : null
        let queryType = host[0]
        host = host.replace(queryType, '')
        let queryOption = queryType === SUPPORTED_TYPES[4] ? host[0] : ''
        host = host.replace(queryOption, '')
        let queryTuning = queryOption === '$' ? host[0] : ''
        host.replace(queryTuning, '')
        let queryMethod = method
        return {split, join, count, multiple, host, path, queryType, queryOption, queryTuning, queryMethod}
    }

    fetch.destroy = () => {
        gun = undefined
    }

    return fetch

}