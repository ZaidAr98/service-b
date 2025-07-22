import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SummationService } from './summation.service';
import { SummationResponse, SummationStats } from './interfaces/summation.interface';

@ApiTags('Summation')
@Controller('summation')
export class SummationController {
  constructor(private readonly summationService: SummationService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get total summation of all numbers',
    description: 'Returns the running total of all addition results processed by the system'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Current summation data',
  })
  async getSummation(): Promise<SummationResponse> {
    return await this.summationService.getSummation();
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get detailed summation statistics',
    description: 'Returns comprehensive statistics including min/max values and recent operations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed summation statistics',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recent operations to include (default: 10)',
  })
  async getStats(@Query('limit') limit?: string): Promise<SummationStats> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.summationService.getStats(limitNum);
  }

  @Get('all')
  @ApiOperation({ 
    summary: 'Get all summation records',
    description: 'Returns all individual addition operations stored in the database'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'All summation records',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records per page (default: 50)',
  })
  async getAllRecords(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.summationService.getAllRecords(pageNum, limitNum);
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check for summation service',
    description: 'Returns health status and Kafka consumer information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service health status',
  })
  getHealth() {
    return this.summationService.getHealth();
  }
}