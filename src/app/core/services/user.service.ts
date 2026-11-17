import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private usersSignal = signal<User[]>([
    {
      id: '1',
      name: 'Sofia Gomez',
      email: 'sofia.gomez@empresa.com',
      role: 'Admin',
      status: 'active',
      createdAt: '2026-01-15',
    },
    {
      id: '2',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@empresa.com',
      role: 'Editor',
      status: 'active',
      createdAt: '2026-02-10',
    },
    {
      id: '3',
      name: 'Laura Restrepo',
      email: 'laura.restrepo@empresa.com',
      role: 'Viewer',
      status: 'pending',
      createdAt: '2026-03-01',
    },
    {
      id: '4',
      name: 'Mateo Morales',
      email: 'mateo.morales@empresa.com',
      role: 'Viewer',
      status: 'inactive',
      createdAt: '2026-03-12',
    },
  ]);

  private searchQuery = signal<string>('');

  readonly allUsers = this.usersSignal.asReadonly();
  readonly currentSearch = this.searchQuery.asReadonly();

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.usersSignal();

    return this.usersSignal().filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q)
    );
  });

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  addUser(user: Omit<User, 'id' | 'createdAt'>) {
    const newUser: User = {
      ...user,
      id: (this.usersSignal().length + 1).toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.usersSignal.update((users) => [newUser, ...users]);
  }

  deleteUser(id: string) {
    this.usersSignal.update((users) => users.filter((u) => u.id !== id));
  }
}
