module.exports = (ctx) => {
  const register = () => {
    ctx.helper.uploader.register('tgImgUp', {
      handle,
      name: 'Telegram图床',
      config: config
    })
  }
  const postOptions = (image, url, fileName) => {
    let headers = {
      contentType: 'multipart/form-data',
      'User-Agent': 'PicGo'
    }
    let formData = {}
    const opts = {
      method: 'POST',
      url: url,
      headers: headers,
      formData: formData
    }
    opts.formData[fileName] = {}
    opts.formData[fileName].value = image
    opts.formData[fileName].options = {
      filename: fileName
    }
    return opts
  }

  const handle = async (ctx) => {
    let userConfig = ctx.getConfig('picBed.tgImgUp')

    if (!userConfig) {
      throw new Error('Can\'t find uploader config')
    }
    const url = userConfig.url + '/upload'
    const jsonPath ='0.src'
    try {
      let imgList = ctx.output
      for (let i in imgList) {
        let image = imgList[i].buffer
        if (!image && imgList[i].base64Image) {
          image = Buffer.from(imgList[i].base64Image, 'base64')
        }
        const postConfig = postOptions(image, url, imgList[i].fileName)
        let body = await ctx.Request.request(postConfig)

        delete imgList[i].base64Image
        delete imgList[i].buffer
        if (!jsonPath) {
          imgList[i]['imgUrl'] = body
        } else {
          body = JSON.parse(body)
          let imgUrl = body
          for (let field of jsonPath.split('.')) {
            imgUrl = imgUrl[field]
          }
          if (imgUrl) {
            imgList[i]['imgUrl'] = userConfig.url+imgUrl
          } else {
            ctx.emit('notification', {
              title: '返回解析失败',
              body: '请检查JsonPath设置'
            })
          }
        }
      }
    } catch (err) {
      ctx.emit('notification', {
        title: '上传失败',
        body: JSON.stringify(err)
      })
    }
    
  }

  const config = ctx => {
    return [
      {
      name: 'url', // 配置名
      type: 'input', // 配置类型，input 展示为一个输入框
      default: '', // 默认值
      required: true, // 是否必填
      message: '上传接口' // 占位符
    }
  ];
  }
  return {
      uploader: 'tgImgUp',
      register
    }
  }