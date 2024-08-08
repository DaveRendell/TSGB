export default class AttributeFile {
  data = [...new Array(18).map(_ => 
    new Array(20).fill(0) 
  )]

  constructor(bytes: number[] = new Array(90).fill(0)) {
    // TODO: parse ATF from bytes
  }
}