import buildShaders from './build-shaders.js'
import { glMatrix, mat4 } from 'gl-matrix'
glMatrix.setMatrixArrayType(Array) 

console.log('glMatrix', glMatrix)
console.log('mat4', mat4)

// Maydo TODO: tidy up function, e.g. deleteBuffer(vb)...

export function useCanvas(canvas) {
  const maxResolution = 4096
  const vertexCountSqrt = 32
  const quadCountSqrt = vertexCountSqrt - 1
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

    gl.useProgram(shader.progs.calculateVertices)
    // static
    // dynamic
    gl.uniform1f(shader.uniLocs.calculateVertices.time, 0)
    gl.uniform1f(shader.uniLocs.calculateVertices.progress, 0)

    gl.useProgram(shader.progs.drawVertices)
    // static
    gl.uniform1i(shader.uniLocs.drawVertices.quadCountSqrt, quadCountSqrt)
    gl.uniform1i(shader.uniLocs.drawVertices.vertexCountSqrt, vertexCountSqrt)
    gl.uniform1f(shader.uniLocs.drawVertices.quadCountSqrtInverse, 1.0 / quadCountSqrt)
    gl.uniform1f(shader.uniLocs.drawVertices.vertexCountSqrtInverse, 1.0 / vertexCountSqrt)
    // dynamic 
    
    gl.useProgram(shader.progs.drawTexture)
    // static
    // dynamic
    gl.uniform2fv(shader.uniLocs.drawTexture.position, [0.1, 0.6])
    gl.uniform2fv(shader.uniLocs.drawTexture.size, [0.2, 0.2])
  }
  
  const initGeometry = () => {
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
  const initVerticesTexture = () => {
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

  let progress = 0
  let quit = false
  let t0 = Date.now()
  let time = 0
  const loop = () => {
    time = (Date.now() - t0) / 1000
    resize()
    draw()
    if(!quit) {
      window.requestAnimationFrame(loop)
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

  const draw = () => {
    clearFrameBuffer()
    calculateVertices()
    drawVertices()
    // drawVerticesTexture()
  }
  
  const clearFrameBuffer = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.NULL)
    gl.viewport(0,0,resolution,resolution)
    gl.clearColor(0.30,0.30,0.30,1)
    console.log('clear') 
    gl.clearDepth(0)
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
  }

  const calculateVertices = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, verticesFramebuffer)
    gl.viewport(0,0,vertexCountSqrt,vertexCountSqrt)

    gl.useProgram(shader.progs.calculateVertices)
    // uniforms
    gl.uniform1f(shader.uniLocs.calculateVertices.time, time) 
    
    gl.bindVertexArray(quadVao) 
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const drawVertices = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.NULL)
    gl.viewport(0, 0, resolution, resolution) 

    chooseProgram()
    

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, verticesTexture)

    gl.bindVertexArray(verticesVao) 
    gl.drawArrays(gl.TRIANGLES, 0, quadCount * 6)
  }

  const chooseProgram = () => {
    
    gl.useProgram(shader.progs.drawVertices)
    let perspective = [
      1,	0,	0,	0,
      0,	1,	0,	0,
      0,	0,	1, 0,
      0,  0,  0,  1
    ]
    let lookAt = [] 
    let camera = []
    mat4.lookAt(
      lookAt,
      [0.0,	  0,	0.5 ],	
      [-0.2,	0,	0   ],	
      [0,	    1,	0   ]
    )
    mat4.mul(
      camera,
      perspective,
      lookAt, 
    )

    gl.uniformMatrix4fv(shader.uniLocs.drawVertices.camera, false, camera) 
        
  }

  const drawVerticesTexture = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.NULL)
    gl.viewport(0, 0, resolution, resolution)

    gl.useProgram(shader.progs.drawTexture) 

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, verticesTexture)

    gl.bindVertexArray(quadVao)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4) 
  }

  if(initGl()) {
    setTimeout(() => {
      initShaderPrograms()
      initGeometry()
      initVerticesTexture()
      loop()
    })
    // return 3dCockpit
    return { 
      setAnimProgress: (destination, duration) => {
        duration = duration || 0
        // TBD: smooth
        progress = destination
      },
      quit: () => { 
        quit = true 
      }
    }
  } else {
    return undefined
  }
}
