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
  const GL_TEXTURE = []
  const GL_COLOR_ATTACHMENT = []
  const initGl = () => {
    gl = canvas.getContext("webgl2", {
      preserveDrawingBuffer: true,
      premultipliedAlpha: false
    })

    if (!gl) {
      console.error("could not get webgl2 content")
      return false
    }

    for(let t of [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3]) GL_TEXTURE.push(t)
    for(let t of [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]) GL_COLOR_ATTACHMENT.push(t)
    
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

    gl.useProgram(shader.progs.genGeo)
    // static 
    gl.uniform1i(shader.uniLocs.genGeo.quadCountSqrt, quadCountSqrt)
    gl.uniform1f(shader.uniLocs.genGeo.vertexCountSqrtInverse, 1.0 / vertexCountSqrt)
    gl.uniform1f(shader.uniLocs.genGeo.quadCountSqrtInverse, 1.0 / quadCountSqrt)
    // dynamic 
    gl.uniform1f(shader.uniLocs.genGeo.flatness, 0.8)

    gl.useProgram(shader.progs.renderGeo)
    // static
    gl.uniform1i(shader.uniLocs.renderGeo.quadCountSqrt, quadCountSqrt)
    gl.uniform1f(shader.uniLocs.renderGeo.quadCountSqrtInverse, 1.0 / quadCountSqrt)
    gl.uniform1i(shader.uniLocs.renderGeo.geoTexV0, 0)
    gl.uniform1i(shader.uniLocs.renderGeo.geoTexV1, 1)
    gl.uniform1i(shader.uniLocs.renderGeo.geoTexV2, 2)
    gl.uniform1i(shader.uniLocs.renderGeo.geoTexLookAt, 3)
    gl.uniform1f(shader.uniLocs.renderGeo.borderZWeight, -0.053)

    // dynamic 
    
    gl.useProgram(shader.progs.dbgTex)
    // static
    // dynamic
    gl.uniform2fv(shader.uniLocs.dbgTex.position, [0.1, 0.6])
    gl.uniform2fv(shader.uniLocs.dbgTex.size, [0.2, 0.2])
    gl.uniform4fv(shader.uniLocs.dbgTex.valueScale, [1,1,1,1])
    gl.uniform4fv(shader.uniLocs.dbgTex.valueShift, [0,0,0,0])
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

  let plasmaTex
  let verticesFramebuffer
  const initPlasmaTex = () => {
    plasmaTex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, plasmaTex)
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
      plasmaTex,
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
        GL_COLOR_ATTACHMENT[i], 
        gl.TEXTURE_2D, 
        geoTex[i], 
        0
      )
    }
  }

  let quit = false
  let t0 = Date.now()
  let time = 0
  let dTime = 0
  const loop = () => {
    let now = (Date.now() - t0) / 1000
    dTime = now - time
    time = now
    updateProgress()
    updateAnimParams()
    resize()
    draw()
    if(!quit) {
      window.requestAnimationFrame(loop)
    }
  }

  let progress = 0
  let progChangeT0 = 0
  let progChangeV0 = 0
  let progChangeT = 0
  let progChangeV = 0
  const updateProgress = () => {
    if(time > progChangeT) {
      progress = progChangeV
    } else {
      let r = ( time - progChangeT0 ) / (progChangeT - progChangeT0) 
      //r = r * r * (3.0 - 2.0 * r)
      progress = r * progChangeV + (1 - r) * progChangeV0
    }
  }

  let scenes = [
		{ name: 'decent', duration: 1 },
		{ name: 'vanished', duration: 1 },
		{ name: 'design', duration: 1 },
		{ name: 'build', duration: 1 },
		{ name: 'learn', duration: 1 },
		{ name: 'fadeout', duration: 1 }
  ]
  const initAnimScenes = () => {
    let p = 0
    for(let s of scenes) {
      s.begin = p; 
      p += s.duration;
    }
  }

  let sceneProg = {}
  let anim = {
    turn: 0,
    yRotate: {
      v: 0,
      v0: 0,
      t: 0, 
      t0: 0,
      angle: 0
    }
  }

  let trigger = {
    yRotate: false
  }

  const updateAnimParams = () => {
    let appear, lin, smooth, swell;
    for(let s of scenes) {
      lin = Math.max(0, Math.min(1, (progress - s.begin) / s.duration))
      smooth = lin * lin * (3.0 - 2.0 * lin)
      appear = 1 - Math.pow(lin - 1, 2) 
      swell = 1 - Math.pow(smooth * 2 - 1, 2)
      sceneProg[s.name] = {appear, lin, smooth, swell }
    }
    
    anim.turn += (dTime * (2.5 - sceneProg.learn.appear * 2.3)) % Math.PI
    anim.transformSpin = Math.pow(sceneProg.build.smooth, 2) * 6
    anim.cameraSpread = 0.4 - 0.32 * sceneProg.learn.smooth
    anim.turbulence = 0.6  + 0.2 * Math.pow(sceneProg.design.smooth, 2)
    anim.shape = sceneProg.build.smooth 
    anim.borderSize = 0.1 - 0.118 * sceneProg.design.smooth - 0.025 * sceneProg.build.swell + 0.025 * sceneProg.build.smooth + sceneProg.learn.smooth * 0.1

    let cells = Math.min(sceneProg.learn.lin * 3, 1) 
    cells = cells * cells * (3.0 - 2.0 * cells) 
    anim.cells = cells 
    anim.cellSize = 50 - 40 * sceneProg.learn.smooth
    anim.fog = 1 - sceneProg.decent.appear + 1*sceneProg.vanished.smooth + sceneProg.design.smooth * -0.9 - Math.pow(sceneProg.build.lin, 2) * 1.8 - sceneProg.build.swell
    anim.cp = [
      1.2 - 0.2 * sceneProg.design.smooth + 0.6 * sceneProg.build.smooth + 0.9 * sceneProg.build.swell,	  
      -sceneProg.fadeout.smooth, 
      0.95 - 0.6 * sceneProg.design.smooth + sceneProg.build.swell * 0.2
    ]
    anim.la = [
      0 + sceneProg.design.smooth * 0.1,
      -sceneProg.fadeout.smooth,
      Math.pow(sceneProg.build.smooth, 1.5)
    ]

    // anim.cull = sceneProg.build.lin >= 1
    
    if(sceneProg.learn.lin > 0) {
      if(!trigger.yRotate) {
        trigger.yRotate = true
        anim.yRotate.v = 0
        anim.yRotate.t = time 
        console.log("trigger!")
      }
    } else {
      trigger.yRotate = false
    }

    if(anim.yRotate.t < time) {
      anim.yRotate.v0 = anim.yRotate.v
      anim.yRotate.v = (Math.random() * 2 - 1) * Math.PI
      anim.yRotate.t0 = time
      anim.yRotate.t = time + ( Math.random() + 3 ) * 0.5 
        * ( Math.abs(anim.yRotate.v0 - anim.yRotate.v) + 0.5)
    } else {
      let r = Math.min(1, (time - anim.yRotate.t0) / (anim.yRotate.t - anim.yRotate.t0) * 1.1) 
      r = 0.5 - 0.5 * Math.cos(r * Math.PI)
      r = r * r * (3.0 - 2.0 * r)
      anim.yRotate.angle = anim.yRotate.v0 * (1 - r) + anim.yRotate.v * r
    }
    anim.yRotate.finalAngle = sceneProg.learn.smooth * anim.yRotate.angle
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

  const draw = () => {
    clearScreen()
    genPlasma()
    genGeometry()
    renderGeometry()
    // dbgPlasma()
    // dbgGeo()
  }
  
  const clearScreen = () => {
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
    gl.uniform1f(shader.uniLocs.genPlasma.turbulence, anim.turbulence) 
    
    gl.bindVertexArray(quadVao) 
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const genGeometry = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, geoFb) 
    gl.viewport(0, 0, quadCountSqrt * 2, quadCountSqrt) 
    gl.drawBuffers([
      gl.COLOR_ATTACHMENT0,
      gl.COLOR_ATTACHMENT1,
      gl.COLOR_ATTACHMENT2,
      gl.COLOR_ATTACHMENT3
    ])

    gl.useProgram(shader.progs.genGeo) 
    
    let camera = [] 
    mat4.lookAt(
      camera,
      anim.cp, 
      anim.la,
      [0, 1, 0]
    )
    gl.uniformMatrix4fv(shader.uniLocs.genGeo.camera, false, camera) 
    gl.uniform1f(shader.uniLocs.genGeo.cameraSpread, anim.cameraSpread)
    gl.uniform1f(shader.uniLocs.genGeo.shape, anim.shape)

    setPrismMatrices()

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, plasmaTex) 

    gl.bindVertexArray(quadVao) 
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const xScale = Math.sqrt(0.75) 
  const foldAngle = Math.PI - Math.acos(1/3) // radians

  const shear = mat4.create()
  shear[0] = xScale
  shear[1] = 0.5
  
  const fold0Shift = [], fold0Unshift = []
  mat4.fromTranslation(fold0Shift, [0, -1, 0, 0])
  mat4.invert(fold0Unshift, fold0Shift)

  const foldAxis = []
  foldAxis[0] = [xScale, -0.5, 0, 0]
  foldAxis[1] = [0, -1, 0, 0]
  foldAxis[2] = [-xScale, 0.5, 0, 0]

  const scale = []
  mat4.fromScaling(scale, [0.5,0.5,0.5,1])

  const translate = []
  mat4.fromTranslation(translate, [xScale * 0.3333, - 0.5, -0.1, 0])

  const modelTransform = []
  mat4.mul(modelTransform, scale, translate)

  const mirrorZ = mat4.create()
  mirrorZ[10] = -1
  mirrorZ[0] = -1 // also mirror X, so that culling stays consistent

  const setPrismMatrices = () => {
    let overlapAndShear = mat4.clone(shear)
    overlapAndShear[13] = 1
    let foldRotation = [[],[],[]]  
    for(let r = 0; r < 3; r++) {
      mat4.fromRotation(foldRotation[r], anim.shape * -foldAngle, foldAxis[r]) 
    }
    mat4.mul(foldRotation[0], foldRotation[0], fold0Shift)
    mat4.mul(foldRotation[0], fold0Unshift, foldRotation[0])

    let modelRotation = [[],[]]
    
    mat4.fromZRotation(modelRotation[0], 
      (anim.transformSpin + anim.turn*1.3 - Math.sin(anim.turn*0.55)) * 0.5 )
    mat4.fromZRotation(modelRotation[1], 
      (anim.transformSpin + anim.turn*2.1 - Math.sin(anim.turn*0.81)) * -0.3 )

    let rotateY = []
    mat4.fromYRotation(rotateY, anim.yRotate.finalAngle)

    let riseTranslate = []
    mat4.fromTranslation(riseTranslate, [0, 0, anim.shape, 0])

    let side = []
    let s
    for(let x = 0; x < 2; x++) {
      side[x] = []
      for(let y = 0; y < 2; y++) {
        side[x][y] = []
        for(let ab = 0; ab < 2; ab++) {
          if(y == 0) {
            s = mat4.clone(overlapAndShear) 
          } else {
            s = mat4.clone(shear)
          }
          if(x == 1) {
            if(ab == 1) {
              mat4.mul(s, foldRotation[0], s)
            } 
            mat4.mul(s, foldRotation[1], s)
          } else if (ab == 0) {
            mat4.mul(s, foldRotation[2], s)
          }

          if(y == 0) {
            
          } else {
            
          }

          mat4.mul(s, modelTransform, s) 

          mat4.mul(s, modelRotation[y], s) 

          if(y == 0) {
            mat4.mul(s, mirrorZ, s) 
          }

          mat4.mul(s, rotateY, s) 

          mat4.mul(s, riseTranslate, s) 
          
          side[x][y][ab] = s
        }
      }
    }

    // mat4.mul(side[0][0][0], foldRotation[2], shear);

    gl.uniformMatrix4fv(shader.uniLocs.genGeo.prismSide00A, false, side[0][0][0])
    gl.uniformMatrix4fv(shader.uniLocs.genGeo.prismSide00B, false, side[0][0][1])
    gl.uniformMatrix4fv(shader.uniLocs.genGeo.prismSide10A, false, side[1][0][0])
    gl.uniformMatrix4fv(shader.uniLocs.genGeo.prismSide10B, false, side[1][0][1])
    gl.uniformMatrix4fv(shader.uniLocs.genGeo.prismSide01A, false, side[0][1][0]) 
    gl.uniformMatrix4fv(shader.uniLocs.genGeo.prismSide01B, false, side[0][1][1]) 
    gl.uniformMatrix4fv(shader.uniLocs.genGeo.prismSide11A, false, side[1][1][0]) 
    gl.uniformMatrix4fv(shader.uniLocs.genGeo.prismSide11B, false, side[1][1][1]) 
  }                                             
                                                
  const renderGeometry = () => {                
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.NULL) 
    gl.viewport(0, 0, resolution, resolution)   

    gl.useProgram(shader.progs.renderGeo)

    gl.uniform1f(shader.uniLocs.renderGeo.pixelSize, 2.0 / resolution)
    gl.uniform1f(shader.uniLocs.renderGeo.resolution, resolution)
    gl.uniform1f(shader.uniLocs.renderGeo.borderSize, anim.borderSize )
    gl.uniform1f(shader.uniLocs.renderGeo.cells, anim.cells)
    gl.uniform1f(shader.uniLocs.renderGeo.cellSize, anim.cellSize)
    gl.uniform1f(shader.uniLocs.renderGeo.fog, anim.fog)
    gl.uniform1f(shader.uniLocs.renderGeo.resolutionInverse, 1.0 / resolution)

    for(let i = 0; i < geoTexCount; i++) {
      gl.activeTexture(GL_TEXTURE[i])
      gl.bindTexture(gl.TEXTURE_2D, geoTex[i])
    }

    gl.enable(gl.DEPTH_TEST) 

    gl.bindVertexArray(verticesVao) 
    gl.drawArrays(gl.TRIANGLES, 0, quadCount * 6)

    gl.disable(gl.DEPTH_TEST)
  }

  const dbgPlasma = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.NULL)
    gl.viewport(0, 0, resolution, resolution)

    gl.useProgram(shader.progs.dbgTex) 

    gl.uniform4fv(shader.uniLocs.dbgTex.valueShift, [0,0,0,0])
    gl.uniform2fv(shader.uniLocs.dbgTex.position, [0.4, 0.6])
    gl.uniform2fv(shader.uniLocs.dbgTex.size, [0.2, 0.2])

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, plasmaTex)

    gl.bindVertexArray(quadVao)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4) 
  }

  const dbgGeo = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.NULL)
    gl.viewport(0, 0, resolution, resolution)

    gl.useProgram(shader.progs.dbgTex) 
    
    gl.uniform4fv(shader.uniLocs.dbgTex.valueShift, [0,0,0,1])

    for(let i = 0; i < geoTexCount; i++) {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, geoTex[i])

      gl.uniform2fv(shader.uniLocs.dbgTex.position, [0.1, 0.1 + 0.2 * i])
      gl.uniform2fv(shader.uniLocs.dbgTex.size, [0.2, 0.1])
      

      gl.bindVertexArray(quadVao)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4) 
    }
  }

  if(initGl()) {
    setTimeout(() => {
      initAnimScenes()
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
        // TODO: improvement 
        // gegeben: (T|V), (T0|V0) und (T0| ableitung an stelle T0)
        // gesucht: funktion, die an Stelle T0 gleiche Steigung hat wie die aktuelle
        //  + die durch (T|V) und (T0|V0) geht. An (T|V) die Steigung 0 
      },
      quit: () => { 
        quit = true 
      }
    }
  } else {
    return undefined
  }
}
