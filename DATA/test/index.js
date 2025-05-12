export default {
  async fetch(request, env) {
    return new Response('Hello from test worker!235');
  }
}