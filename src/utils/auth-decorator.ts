// import { AuthService } from '../services/auth';

// export function requireAuth(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
//     const originalMethod = descriptor.value;

//     descriptor.value = async function (...args: any[]) {
//         const auth = AuthService.getInstance();
//         if (!auth.isAuthenticated()) {
//             throw new Error('Authentication required');
//         }
//         return originalMethod.apply(this, args);
//     };

//     return descriptor;
// } 