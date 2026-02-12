import AsyncStorage from '@react-native-async-storage/async-storage';

const ADDRESS_BOOK_KEY = '@address_book';

export interface Contact {
    address: string;
    name: string;
    emoji: string;
    addedAt: number;
    isTrusted?: boolean; // Safe Label
}

export class AddressBookService {
    static async getContacts(): Promise<Contact[]> {
        try {
            const data = await AsyncStorage.getItem(ADDRESS_BOOK_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to get contacts:', error);
            return [];
        }
    }

    static async addContact(contact: Omit<Contact, 'addedAt'>): Promise<void> {
        try {
            const contacts = await this.getContacts();
            const exists = contacts.find(c => c.address.toLowerCase() === contact.address.toLowerCase());

            if (exists) {
                // Update existing
                const updated = contacts.map(c =>
                    c.address.toLowerCase() === contact.address.toLowerCase()
                        ? { ...c, ...contact, addedAt: Date.now() }
                        : c
                );
                await AsyncStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(updated));
            } else {
                contacts.push({ ...contact, addedAt: Date.now() });
                await AsyncStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(contacts));
            }
        } catch (error) {
            console.error('Failed to add contact:', error);
        }
    }

    static async removeContact(address: string): Promise<void> {
        try {
            const contacts = await this.getContacts();
            const filtered = contacts.filter(c => c.address.toLowerCase() !== address.toLowerCase());
            await AsyncStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('Failed to remove contact:', error);
        }
    }

    static async getContactByAddress(address: string): Promise<Contact | undefined> {
        const contacts = await this.getContacts();
        return contacts.find(c => c.address.toLowerCase() === address.toLowerCase());
    }
}
