import buildShaders from './build-shaders.js'

export function useCanvas(canvas) {
  const maxResolution = 4096
  const vertexCountSqrt = 32
  const quadCountSqrt = vertexCountSqrt - 1
  const vertexCount = Math.pow(vertexCountSqrt, 2) 
  const quadCount = Math.pow(quadCountSqrt, 2)

  let progress = 0


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

  let resolution = 512
  const resize = () => {
    let height = canvas.clientHeight
    console.log(height) 
    let res = Math.min(height, maxResolution)
    if(resolution != res) {
      resolution = res
      canvas.width = res
      canvas.height = res
    }
  }

  let verticesVao
  const initVerticesVao = () => {
    let verticesPerQuad = 2 * 3
    let valuesPerQuad = 2 * verticesPerQuad
    let vertexData = new Float32Array(quadCount * verticesPerQuad)
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
    }
    verticesVao = gl.createVertexArray()
    gl.bindVertexArray(verticesVao) 
    let vb = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vb)
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(0)
    gl.bindVertexArray(gl.NULL)
  }

  var quadVao
  const initQuadVao = () => {
    let vertexData = new Float32Array([
      -1, -1,
       1, -1, 
      -1,  1, 
       1,  1
    ])
    quadVao = gl.createVertexArray()
    gl.bindVertexArray(quadVao) 
    let vb = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vb) 
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW) 
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(0)
    gl.bindVertexArray(gl.NULL)
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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

  let calculateVertices = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, verticesFramebuffer)
    gl.viewport(0,0,vertexCountSqrt,vertexCountSqrt)

    gl.useProgram(shader.progs.calculateVertices)
    // uniforms
    gl.uniform1f(shader.uniLocs.calculateVertices.time, time) 
    
    gl.bindVertexArray(quadVao) 
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const drawVertices = () => {
    gl.viewport(0, 0, resolution, resolution) 
    gl.useProgram(shader.progs.drawVertices)
    gl.bindVertexArray(verticesVao) 
    gl.drawElements(gl.TRIANGLES, quadCount * 6, gl.UNSIGNED_SHORT, 0)
  }

  const initGeometry = () => {
    initVerticesVao()
    initQuadVao()
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
    // dynamic 
    
    gl.useProgram(shader.progs.drawTexture)
    // static
    // dynamic
    gl.uniform2fv(shader.uniLocs.drawTexture.position, [0.1, 0.6])
    gl.uniform2fv(shader.uniLocs.drawTexture.size, [0.2, 0.2])
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

  const draw = () => {
    calculateVertices()
    drawVerticesTexture()
  }

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

  window.addEventListener("resize", () => {
    resize()
  })

  if(initGl()) {
    initShaderPrograms()
    initGeometry()
    initVerticesTexture()
    loop()
  }

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
}
