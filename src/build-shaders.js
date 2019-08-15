import { createProgramFromSources } from './3rd-party/shader-program-build-tool.js'

import vsDrawVertices from './shader/draw-vertices.vert'
import fsDrawVertices from './shader/draw-vertices.frag'

import vsCalculateVertices from './shader/calculate-vertices.vert'
import fsCalculateVertices from './shader/calculate-vertices.frag'

import vsDrawTexture from './shader/draw-texture.vert'
import fsDrawTexture from './shader/draw-texture.frag'

// import shader pieces and combine them together for transitions

const getUniformLocations = (gl, program, uniformNames) => {
  var uniformMap = {}
  for(var i = 0; i < uniformNames.length; i++) {
    var uName = uniformNames[i] 
    uniformMap[uName] = gl.getUniformLocation(program, uName)
  }
  return uniformMap
}

export default function buildShaders(gl) {
  var progs = {}
  var uniLocs = {}

  progs.calculateVertices = createProgramFromSources(gl, [
      vsCalculateVertices, 
      fsCalculateVertices
    ]
  )
  uniLocs.calculateVertices = getUniformLocations(
    gl, progs.calculateVertices, [
      'time',
      'turbulence'
    ]
  )

  progs.drawVertices = createProgramFromSources(gl, [
      vsDrawVertices, 
      fsDrawVertices
    ]
  )
  uniLocs.drawVertices = getUniformLocations(
    gl, progs.drawVertices, [
      'verticesTexture', 
      'quadCountSqrt',
      'quadCountSqrtInverse',
      'vertexCountSqrt',
      'vertexCountSqrtInverse',
      // anim step specific
      'camera',
      'progress',
      'pixelSize'
    ]
  )

  progs.drawTexture = createProgramFromSources(gl, [
      vsDrawTexture, 
      fsDrawTexture
    ]
  )
  uniLocs.drawTexture = getUniformLocations(
    gl, progs.drawTexture, [
      'position', 
      'size',
      'tex'
    ]
  )

  return {
    progs, 
    uniLocs
  }
}

