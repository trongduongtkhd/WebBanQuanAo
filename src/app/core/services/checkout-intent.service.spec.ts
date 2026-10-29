import { CheckoutIntentService } from './checkout-intent.service';
import { TokenService } from './token.service';

describe('CheckoutIntentService',()=>{
  let user=42;
  const tokens={getUser:()=>({userId:user})} as TokenService;
  let service:CheckoutIntentService;
  beforeEach(()=>{user=42;service=new CheckoutIntentService(tokens);service.clear();});
  afterEach(()=>{service.clear();user=43;service.clear();});
  it('generates distinct UUIDs for separate purchase intents',()=>{
    const a=service.newId(), b=service.newId();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a).not.toBe(b);
  });
  it('persists an immutable payload and scopes it to the signed-in customer',()=>{
    const payload={requestId:service.newId(),addressId:1,paymentMethod:1,note:'original'};
    service.save(payload);payload.note='changed';
    expect(new CheckoutIntentService(tokens).read()?.payload.note).toBe('original');
    user=43;expect(service.read()).toBeNull();
    user=42;expect(service.read()?.payload.requestId).toBe(payload.requestId);
  });
});
