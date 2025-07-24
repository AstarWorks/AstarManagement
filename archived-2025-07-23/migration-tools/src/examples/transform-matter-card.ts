import { readFile, writeFile } from 'fs/promises';
import { ReactToVueTransformer } from '../core/transformer.js';

// Example: Transform MatterCard component
async function transformMatterCard() {
  const reactCode = `
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Matter, ViewPreferences } from '@/types';

interface Props {
  matter: Matter;
  isDragging?: boolean;
  viewPreferences: ViewPreferences;
  onClick?: (matter: Matter) => void;
}

export const MatterCard: React.FC<Props> = ({
  matter,
  isDragging = false,
  viewPreferences,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    console.log('Matter updated:', matter.id);
  }, [matter.id]);
  
  const priorityConfig = useMemo(() => {
    const configs = {
      low: { border: 'border-l-gray-400', variant: 'secondary' as const },
      medium: { border: 'border-l-blue-500', variant: 'default' as const },
      high: { border: 'border-l-orange-500', variant: 'default' as const },
      urgent: { border: 'border-l-red-600', variant: 'destructive' as const }
    };
    return configs[matter.priority];
  }, [matter.priority]);
  
  const handleClick = () => {
    if (onClick) {
      onClick(matter);
    }
  };
  
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-150',
        'hover:shadow-md hover:scale-[1.02]',
        'border-l-4',
        priorityConfig.border,
        isDragging && 'opacity-50 shadow-xl z-50 cursor-grabbing',
        !isDragging && 'cursor-grab'
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">{matter.caseNumber}</span>
              <Badge variant={priorityConfig.variant} className="text-xs">
                {matter.priority}
              </Badge>
            </div>
            <h3 className="font-medium text-sm line-clamp-2 mt-1">{matter.title}</h3>
          </div>
        </div>
        
        {viewPreferences.showDueDates && matter.dueDate && (
          <div className="text-xs text-gray-600">
            Due: {new Date(matter.dueDate).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
`;

  const transformer = new ReactToVueTransformer();
  const result = await transformer.transform(reactCode, {
    typescript: true,
    componentName: 'MatterCard'
  });
  
  if (result.success && result.output) {
    console.log('Transformation successful!');
    console.log('Stats:', result.stats);
    console.log('\nOutput:\n', result.output);
    
    // Save to file
    await writeFile('MatterCard.vue', result.output);
  } else {
    console.error('Transformation failed:', result.errors);
  }
}

// Run the example
transformMatterCard().catch(console.error);