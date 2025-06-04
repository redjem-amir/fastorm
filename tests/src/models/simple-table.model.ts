import { Entity, PrimaryGeneratedColumn, Column } from 'nestjs-fastorm';

@Entity('simple_table')
export class SimpleTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}