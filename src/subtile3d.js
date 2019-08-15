import buildShaders from './build-shaders.js'
import { glMatrix, mat4 } from 'gl-matrix'
glMatrix.setMatrixArrayType(Array) 

// Maydo TODO: tidy up function, e.g. deleteBuffer(vb)...

export function useCanvas(canvas) {
  const maxResolution = 4096
  const quadCountSqrt = Math.pow(2, 5) 
  const vertexCountSqrt = quadCountSqrt + 1
  const vertexCount = Math.pow(vertexCountSqrt, 2) 
  const quadCount = Math.pow(quadCountSqrt, 2)

  let gl = undefined
  const initGl = () => {
    gl = canvas.getContext("webgl2", {
      preserveDrawingBuffer: true,
      premultipliedAlpha: false
    })

    if (!gl) {
      console.error("could not get webgl2 content")
      return false
    }
    
    var ext = gl.getExtension('EXT_color_buffer_float')
    if (!ext) {
      console.error("need gl extension EXT_color_buffer_float")
      gl = undefined
      return false
    }
    
    var ext = gl.getExtension('OES_texture_float_linear')
    if (!ext) {
      console.error("need gl extension OES_texture_float_linear")
      gl = undefined
      return false
    }

    return true
  }

  let shader 
  const initShaderPrograms = () => {
    shader = buildShaders(gl)

    gl.useProgram(shader.progs.genPlasma)
    // static
    // dynamic
    gl.uniform1f(shader.uniLocs.genPlasma.time, 0)
    gl.uniform1f(shader.uniLocs.genPlasma.progress, 0)

    gl.useProgram(shader.progs.genGeo)
    // static 
    gl.uniform1i(shader.uniLocs.genGeo.quadCountSqrt, quadCountSqrt)
    gl.uniform1f(shader.uniLocs.genGeo.vertexCountSqrtInverse, 1.0 / vertexCountSqrt)
    gl.uniform1f(shader.uniLocs.genGeo.quadCountSqrtInverse, 1.0 / quadCountSqrt)
    // dynamic 
    gl.uniform1f(shader.uniLocs.genGeo.flatness, 1)

    gl.useProgram(shader.progs.renderGeo)
    // static
    gl.uniform1i(shader.uniLocs.renderGeo.quadCountSqrt, quadCountSqrt)
    // dynamic 
    
    gl.useProgram(shader.progs.dbgTex)
    // static
    // dynamic
    gl.uniform2fv(shader.uniLocs.dbgTex.position, [0.1, 0.6])
    gl.uniform2fv(shader.uniLocs.dbgTex.size, [0.2, 0.2])
  }
  
  const initVaos = () => {
    initVerticesVao()
    initQuadVao()
  }

  let verticesVao
  const initVerticesVao = () => {
    verticesVao = gl.createVertexArray()
    gl.bindVertexArray(verticesVao) 

    let vb = gl.createBuffer()
    let vertexData = new Uint16Array(quadCount * 6)
    /*
    for(var x = 0; x < quadCountSqrt; x++) {
      for(var y = 0; y < quadCountSqrt; y++) {
        var offset = valuesPerQuad * ( x + y * quadCountSqrt)
        
        vertexData[offset + 0]   = x
        vertexData[offset + 1]   = y

        vertexData[offset + 2]   = x
        vertexData[offset + 3]   = y + 1

        vertexData[offset + 4]   = x + 1
        vertexData[offset + 5]   = y


        vertexData[offset + 6]   = x
        vertexData[offset + 7]   = y + 1

        vertexData[offset + 8]   = x + 1
        vertexData[offset + 9]   = y + 1
        
        vertexData[offset + 10]  = x + 1
        vertexData[offset + 11]  = y
      }
    } */

    gl.bindBuffer(gl.ARRAY_BUFFER, vb)
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW)
    gl.vertexAttribIPointer(0, 1, gl.UNSIGNED_SHORT, 0, 0)
    gl.enableVertexAttribArray(0)
  }

  var quadVao
  const initQuadVao = () => {
    quadVao = gl.createVertexArray()
    gl.bindVertexArray(quadVao) 

    let vb = gl.createBuffer()
    let vertexData = new Float32Array([
      -1, -1,
       1, -1, 
      -1,  1, 
       1,  1
    ])
    gl.bindBuffer(gl.ARRAY_BUFFER, vb) 
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW) 
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(0)
  }

  let verticesTexture
  let verticesFramebuffer

  const initPlasmaTex = () => {
    verticesTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, verticesTexture)
    gl.texImage2D(
      gl.TEXTURE_2D, 
      0, 
      gl.RGBA32F, 
      vertexCountSqrt, 
      vertexCountSqrt, 
      0, 
      gl.RGBA, //x,y,z, progress
      gl.FLOAT,
      null
    ) 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    verticesFramebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, verticesFramebuffer) 
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, 
      gl.COLOR_ATTACHMENT0, 
      gl.TEXTURE_2D, 
      verticesTexture,
      0)
  }

  const geoTexCount = 4
  let geoTex = []
  let geoFb
  const initGeoTex = () => {
    var createTexture = () => {
      var tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(
        gl.TEXTURE_2D, 
        0, 
        gl.RGBA32F, 
        quadCountSqrt * 2, 
        quadCountSqrt, 
        0, 
        gl.RGBA,
        gl.FLOAT,
        null
      ) 
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return tex
    }
    geoFb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, geoFb) 
    for(var i = 0; i < geoTexCount; i++) {
      geoTex[i] = createTexture()
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER, 
        gl.COLOR_ATTACHMENT0 + i, 
        gl.TEXTURE_2D, 
        geoTex[i], 
        0
      )
    }
  }

  let progress = 0
  let quit = false
  let t0 = Date.now()
  let time = 0
  const loop = () => {
    time = (Date.now() - t0) / 1000
    updateProgress()
    resize()
    draw()
    if(!quit) {
      window.requestAnimationFrame(loop)
    }
  }

  let progChangeT0 = 0
  let progChangeV0 = 0
  let progChangeT = 0
  let progChangeV = 0
  const updateProgress = () => {
    if(time > progChangeT) {
      progress = progChangeV
    } else {
      let r = ( time - progChangeT0 ) / (progChangeT - progChangeT0) 
      r = r * r * (3.0 - 2.0 * r)
      progress = r * progChangeV + (1 - r) * progChangeV0
    }
  }

  let resolution = 512
  const resize = () => {
    let height = canvas.clientHeight
    let res = Math.min(height, maxResolution)
    if(resolution != res) {
      resolution = res
      canvas.width = res
      canvas.height = res
    }
  }

  let sceneProgress
  const draw = () => {
    sceneProgress = progress % 1
    clearFrameBuffer()
    genPlasma()
    genGeometry()
    renderGeometry()
    // dbgPlasma()
    dbgGeo()
  }
  
  const clearFrameBuffer = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.NULL)
    gl.viewport(0,0,resolution,resolution)
    gl.clearColor(1,1,1,0)
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
  }

  const genPlasma = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, verticesFramebuffer)
    gl.viewport(0,0,vertexCountSqrt,vertexCountSqrt)

    gl.useProgram(shader.progs.genPlasma)
    // uniforms
    gl.uniform1f(shader.uniLocs.genPlasma.time, time) 
    let turbulence = 0.7 + 0.4*Math.max(0, 1 - Math.pow(progress - 1, 2))
    gl.uniform1f(shader.uniLocs.genPlasma.turbulence, turbulence) 
    
    gl.bindVertexArray(quadVao) 
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const genGeometry = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, geoFb) 
    gl.viewport(quadCountSqrt * 2, quadCountSqrt) 

    gl.useProgram(shader.progs.genGeo) 
    
    let camera = [] 
    mat4.lookAt(
      camera,
      [1.2 - 0.2 * sceneProgress,	  0, 0.95 - 0.6 * sceneProgress],	
      [0 + sceneProgress * 0.35, 	  0,	0   ],	
      [0,	    1,	0   ]
    )
    gl.uniformMatrix4fv(shader.uniLocs.genGeo.camera, false, camera) 

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, verticesTexture)

    gl.bindVertexArray(quadVao) 
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const renderGeometry = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.NULL)
    gl.viewport(0, 0, resolution, resolution) 

    gl.useProgram(shader.progs.renderGeo)

    gl.uniform1f(shader.uniLocs.renderGeo.pixelSize, 2.0 / resolution)
    gl.uniform1f(shader.uniLocs.renderGeo.resolution, resolution)
    gl.uniform1f(shader.uniLocs.renderGeo.progress, sceneProgress)

    for(let i = 0; i < 4; i++) {
      gl.activeTexture(gl.TEXTURE0 + i)
      gl.bindTexture(gl.TEXTURE_2D, geoTex[i])
    }

    gl.enable(gl.DEPTH_TEST) 

    gl.bindVertexArray(verticesVao) 
    gl.drawArrays(gl.TRIANGLES, 0, quadCount * 6)

    gl.disable(gl.DEPTH_TEST)
  }

  const chooseProgram = () => {
    

        
  }

  const dbgPlasma = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.NULL)
    gl.viewport(0, 0, resolution, resolution)

    gl.useProgram(shader.progs.dbgTex) 

    gl.uniform2fv(shader.uniLocs.dbgTex.position, [0.1, 0.6])
    gl.uniform2fv(shader.uniLocs.dbgTex.size, [0.2, 0.2])

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, verticesTexture)

    gl.bindVertexArray(quadVao)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4) 
  }

  const dbgGeo = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.NULL)
    gl.viewport(0, 0, resolution, resolution)
    gl.useProgram(shader.progs.dbgTex) 
    for(let i = 0; i < 4; i++) {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, geoTex[i])

      gl.uniform2fv(shader.uniLocs.dbgTex.position, [0.1, 0.1 + 0.2 * i])
      gl.uniform2fv(shader.uniLocs.dbgTex.size, [0.1, 0.2])

      gl.bindVertexArray(quadVao)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4) 
    }
  }

  if(initGl()) {
    setTimeout(() => {
      initShaderPrograms()
      initVaos()
      initPlasmaTex()
      initGeoTex()
      loop()
    })
    // return 3dCockpit
    return { 
      setAnimProgress: (destination, duration) => {
        duration = duration || 0
        progChangeV0 = progress
        progChangeT0 = time
        progChangeT = time + duration
        progChangeV = destination
      },
      quit: () => { 
        quit = true 
      }
    }
  } else {
    return undefined
  }
}
