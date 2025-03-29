declare module "socket.io-adapter" {
  export interface Adapter {
    rooms: Map<string, Set<string>>;
    sids: Map<string, Set<string>>;
    nsp: any;
  }
}
